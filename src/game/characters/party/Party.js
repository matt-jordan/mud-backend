//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import asyncForEach from '../../../lib/asyncForEach.js';
import log from '../../../lib/log.js';
import World from '../../world/World.js';
import PartyModel from '../../../db/models/PartyModel.js';
import PartyMetadata from './PartyMetadata.js';
import PartyMetadataError from './PartyMetadataError.js';

class Party {
  #partyLeader;
  #partyMembers;
  #invitedMembers;
  #partyMetadata;

  static #partyRegister = {};

  /**
   * Retrieve a party
   *
   * @param {Character} character - The character who may be in a party
   */
  static getParty(character) {
    if (character.id in Party.#partyRegister) {
      return Party.#partyRegister[character.id];
    }

    return Object.values(Party.#partyRegister).find((party) => party.inParty(character));
  }

  /**
   * Get all parties we were invited to
   *
   * @param {Character} character - The invited character
   *
   * @returns {List<Party>}
   */
  static getInvitedParties(character) {
    return Object.values(Party.#partyRegister).filter((party) => party.isInvited(character));
  }

  /**
   * Factory method for creating parties given a party leader
   *
   * @param {Character} partyLeader - The leader of the party
   *
   * @returns {Party}
   */
  static async createParty(partyLeader) {
    if (partyLeader.id in Party.#partyRegister) {
      return Party.#partyRegister[partyLeader.id];
    }

    const model = new PartyModel();
    model.partyLeaderId = partyLeader.id;
    model.partyMembers.push({ characterId: partyLeader.id });
    model.maxPartyMembers = Math.max(2, 2 + partyLeader.getAttributeModifier('charisma'));
    await model.save();

    const party = new Party(model);
    await party.load();

    Party.#partyRegister[partyLeader.id] = party;

    return party;
  }

  /**
   * Save all parties in the registry
   */
  static async save() {
    await asyncForEach(Object.values(Party.#partyRegister), async (party) => {
      await party.save();
    });
  }

  /**
   * Create a new party
   *
   * @param {PartyModel} model - the underlying database model
   */
  constructor(model) {
    this.world = World.getInstance();
    this.model = model;

    this.#partyLeader = null;
    this.#partyMembers = [];
    this.#invitedMembers = [];
    this.#partyMetadata = new PartyMetadata();
  }

  /**
   * The total number of members in the party (invited or otherwise)
   *
   * @returns {Number}
   */
  get length() {
    return this.#partyMembers.length + this.#invitedMembers.length;
  }

  /**
   * The party leader
   *
   * @returns {Character}
   */
  get leader() {
    return this.#partyLeader;
  }

  /**
   * Add an invitee as a member
   *
   * @param {Character} character - The character to invite
   *
   * @returns {Boolean}
   */
  addInvitee(character) {
    if (this.length >= this.model.maxPartyMembers) {
      return false;
    }

    // Don't invite twice
    if (this.#invitedMembers.includes(character)) {
      return true;
    }
    this.#invitedMembers.push(character);

    return true;
  }

  /**
   * Remove an invited character without adding them as a member
   *
   * @param {Character} character - The character to invite
   */
  removeInvitee(character) {
    const invitedIndex = this.#invitedMembers.indexOf(character);
    if (invitedIndex > -1) {
      this.#invitedMembers.splice(invitedIndex, 1);
    }
  }

  /**
   * Add a character as a member
   *
   * @param {Character} character - The character to add
   *
   * @returns {Boolean}
   */
  addMember(character) {
    const invitedIndex = this.#invitedMembers.indexOf(character);
    if (invitedIndex === -1 && this.length >= this.model.maxPartyMembers) {
      return false;
    } else if (invitedIndex > -1 && this.length - 1 >= this.model.maxPartyMembers) {
      return false;
    }

    if (this.#partyMembers.includes(character)) {
      return true;
    }

    if (invitedIndex > -1) {
      this.#invitedMembers.splice(invitedIndex, 1);
    }
    this.#partyMembers.push(character);

    return true;
  }

  /**
   * Remove a character as a member
   *
   * @param {Character} character - The character to remove
   *
   * This will only return false on an error. A character not in the party is
   * a collective shrug.
   *
   * @returns {Boolean}
   */
  removeMember(character) {
    if (character === this.leader) {
      return false;
    }

    const memberIndex = this.#partyMembers.indexOf(character);
    if (memberIndex > -1) {
      this.#partyMembers.splice(memberIndex, 1);
    }

    return true;
  }

  /**
   * Test if a character is in a party
   *
   * @param {Character} character - The character who may be in a party
   *
   * @return {Boolean}
   */
  inParty(character) {
    return this.#partyMembers.includes(character);
  }

  /**
   * Test if a character was invited to the party
   *
   * @param {Character} character - The character who may be invited
   *
   * @returns {Boolean}
   */
  isInvited(character) {
    return this.#invitedMembers.includes(character);
  }

  /**
   * Add experience to the party
   *
   * @param {Character} character      - The character who contributed the experience
   * @param {Number}    encounterLevel - The level of the encounter
   */
  addExperience(character, encounterLevel) {
    const validMembers = this.#partyMembers.filter((c) => c.room === character.room);
    const modifier = this.#partyMembers.length;
    validMembers.forEach((member) => {
      member.addExperience(encounterLevel, modifier);
    });
  }

  /**
   * Record a kill across a party
   *
   * This is a little bit interesting. We don't give credit for killing something
   * to the other party members, but we do want to track the 'effect' of killing
   * the creature on them. In this particular case, we're going to trigger the
   * 'kill' event on the other party members if they're in the same room.
   *
   * @param {Character} killingCharacter - The character who did the deed
   * @param {Character} killedCharacter  - The character who suffered the deed
   */
  addKill(killingCharacter, killedCharacter) {
    const validMembers = this.#partyMembers.filter((c) => c.room === killingCharacter.room && c !== killingCharacter);
    killingCharacter.addKill(killedCharacter);
    validMembers.forEach((member) => {
      member.emit('kill', member, killedCharacter);
    });
  }

  /**
   * Apply an effect via callback function to all party members
   *
   * @param {Function} callback - The callback to invoke. Will be passed each party member.
   */
  applyEffect(callback) {
    this.#partyMembers.forEach(member => {
      callback(member);
    });
  }

  /**
   * Set a property on the party
   *
   * @param {Character} character - The invoking character
   * @param {Object}    property  - The property they are setting
   *
   * @throws {PartyMetadataError}
   */
  setProperty(character, property) {
    const targetVal = property.target;
    if (targetVal) {
      const target = this.#partyMembers.find((c) => c.name.toLowerCase() === targetVal.toLowerCase());
      if (!target) {
        throw new PartyMetadataError(`${targetVal} is not a member of the party.`);
      }
      property.target = target;
    }

    this.#partyMetadata.set(character, property);
  }

  /**
   * Destroy the party
   *
   * The party is *not* safe to use once this method is called.
   *
   * @param {Boolean} sendMessages - Notify the characters in the party that
   *                                 the party has ended
   */
  async destroy(sendMessages = false) {
    if (!this.#partyLeader) {
      return;
    }

    if (this.#partyLeader.id in Party.#partyRegister) {
      delete Party.#partyRegister[this.#partyLeader.id];
    }

    if (sendMessages) {
      this.#partyLeader.sendImmediate('You have disbanded your party.');
      this.#partyMembers.forEach((member) => {
        if (member !== this.#partyLeader) {
          member.sendImmediate(`${this.#partyLeader.toShortText()} has disbanded the party.`);
        }
      });
      this.#invitedMembers.forEach((invitee) => {
        invitee.sendImmediate(`${this.#partyLeader.toShortText()} has disbanded their party.`);
      });
    }

    // Prevent accessing any other information about the party, just in case
    this.#partyMembers = [];
    this.#invitedMembers = [];
    this.#partyLeader = null;

    await PartyModel.deleteOne({ _id: this.model._id });
  }

  /**
   * Convert the party into JSON suitable for sending as a message
   *
   * @returns {Object}
   */
  toJson() {
    const message = {
      size: this.#partyMembers.length,
      maxSize: this.model.maxPartyMembers,
      leader: {
        name: this.#partyLeader.toShortText(),
        classes: this.#partyLeader.classes.map((c) => c.toJson()),
        metadata: this.#partyMetadata.toJson(this.#partyLeader),
      },
      members: this.#partyMembers.filter((m) => m !== this.#partyLeader).map((member) => {
        return {
          name: member.toShortText(),
          classes: member.classes.map((c) => c.toJson()),
          metadata: this.#partyMetadata.toJson(member),
        };
      }),
    };

    return message;
  }

  /**
   * Load the party into memory
   */
  async load() {
    this.#partyLeader = this.world.characters.find((c) => this.model.partyLeaderId.equals(c.id));
    if (!this.#partyLeader) {
      log.warn({ partyLeaderId: this.model.partyLeaderId.toString() }, 'Unable to find party leader in world');
      return;
    }

    this.model.partyMembers.forEach((partyMember) => {
      const character = this.world.characters.find((c) => partyMember.characterId.equals(c.id));
      if (!character) {
        log.warn({ partyMemberId: partyMember.characterId }, 'Unable to find party member in world');
      } else {
        this.#partyMembers.push(character);
      }
    });

    this.model.invitedMemberIds.forEach((characterId) => {
      const character = this.world.characters.find((c) => characterId.toString() === c.id);
      if (!character) {
        log.warn({ invitedMemberId: characterId }, 'Unable to find invited member in world');
      } else {
        this.#invitedMembers.push(character);
      }
    });

    if (!(this.#partyLeader.id in Party.#partyRegister)) {
      Party.#partyRegister[this.#partyLeader.id] = this;
    }
  }

  /**
   * Save the party
   */
  async save() {
    if (this.#partyLeader) {
      this.model.partyLeaderId = this.#partyLeader.id;
    }
    this.model.partyMembers = this.#partyMembers.map((partyMember) => {
      return {
        characterId: partyMember.id,
      };
    });
    this.model.invitedMemberIds = this.#invitedMembers.map((member) => member.id);
    this.model.save();
  }
}

export default Party;
