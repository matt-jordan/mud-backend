//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Party from '../../characters/party/Party.js';

/**
 * @module game/commands/party/PartyInvite
 */

/**
 * An action that causes you to invite another person to a party
 */
class PartyInvite {

  /**
   * Create a new PartyInvite action
   *
   * @param {String} target - The target of the invite
   */
  constructor(target) {
    this.target = target;
  }

  /**
   * Execute the PartyInvite action on the character
   *
   * @param {Character} character - the character to execute on
   */
  async execute(character) {
    if (!character.room) {
      character.sendImmediate('You are floating in a void.');
      return;
    }

    const party = Party.getParty(character);
    if (!party || party.leader !== character) {
      character.sendImmediate('You are not leading a party.');
      return;
    }

    const room = character.room;
    const target = room.characters.findItem(this.target);
    if (!target) {
      character.sendImmediate(`You do not see '${this.target}' here.`);
      return;
    }

    if (target === character) {
      character.sendImmediate('You cannot invite yourself to your own party.');
      return;
    }

    const otherParty = Party.getParty(target);
    if (otherParty) {
      if (otherParty.leader === character) {
        character.sendImmediate(`'${this.target}' is already in your party.`);
      } else {
        character.sendImmediate(`'${this.target}' is already in a party.`);
      }
      return;
    }

    if (!party.addInvitee(target)) {
      character.sendImmediate(`You cannot invite '${this.target}'; your party is full.`);
      return;
    }
    character.sendImmediate(`You invite '${this.target}' to your party.`);
    target.sendImmediate(`${character.toShortText()} invites you to their party.`);
  }
}

export { PartyInvite };