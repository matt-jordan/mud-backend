//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Party from '../../characters/Party.js';

/**
 * @module game/commands/party/PartyAccept
 */

/**
 * An action that causes you to leave a party
 */
class PartyAccept {

  /**
   * Create a new PartyAccept action
   *
   * @param {String} target - The invite to accept
   */
  constructor(target) {
    this.target = target;
  }

  /**
   * Execute the command on the character
   *
   * @param {Character} character - The character who executed the command
   */
  async execute(character) {
    const parties = Party.getInvitedParties(character);
    if (!parties || parties.length === 0) {
      character.sendImmediate('You have not been invited to any parties.');
      return;
    }

    const targetParty = parties.find(p => p.leader.name.toLowerCase() === this.target.toLowerCase());
    if (!targetParty) {
      character.sendImmediate(`You do not have an invite to join ${this.target}'s party.`);
      return;
    }

    if (!targetParty.addMember(character)) {
      character.sendImmediate(`You cannot join ${this.target}'s party; it is full!`);
      targetParty.leader.sendImmediate(`${character.toShortText()} cannot join your party; it is full!`);
      return;
    }

    character.sendImmediate(`You join ${this.target}'s party!`);
    targetParty.leader.sendImmediate(`${character.toShortText()} has joined your party!`);
    parties.filter(p => p !== targetParty).forEach((party) => {
      party.removeInvitee(character);
      party.leader.sendImmediate(`${character.toShortText()} has joined another party.`);
    });
  }

}

export { PartyAccept };