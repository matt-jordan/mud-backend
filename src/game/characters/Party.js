//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import log from '../../lib/log.js';
import World from '../world/World.js';
import PartyModel from '../../db/models/PartyModel.js';

class Party {
  #partyLeader;
  #partyMembers;
  #invitedMembers;

  static #partyRegister = {};

  /**
   * Retrieve a party by its leader
   *
   * @param {Character} partyLeader - The leader of the party
   */
  static getParty(partyLeader) {
    return Party.#partyRegister[partyLeader.id];
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
   * Destroy the party
   *
   * The party is *not* safe to use once this method is called.
   */
  async destroy() {
    if (this.#partyLeader.id in Party.#partyRegister) {
      delete Party.#partyRegister[this.#partyLeader.id];
    }

    await PartyModel.deleteOne({ _id: this.model._id });
  }

  /**
   * Load the party into memory
   */
  async load() {
    this.#partyLeader = this.world.characters.find((c) => this.model.partyLeaderId.equals(c.id));
    if (!this.#partyLeader) {
      log.warn({ partyLeaderId: this.model.partyLeaderId.toString() }, 'Unable to find party leader in world');
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
  }

  /**
   * Save the party
   */
  async save() {
    if (this.#partyLeader) {
      this.model.partyLeaderId = this.#partyLeader.id;
    }
    this.model.partyMembers = this.partyMembers.map((partyMember) => {
      return {
        characterId: partyMember.id,
      };
    });
    this.model.invitedMemberIds = this.#invitedMembers.map((member) => member.id);
    this.model.save();
  }
}

export default Party;
