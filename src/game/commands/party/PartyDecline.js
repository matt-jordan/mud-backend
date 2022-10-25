//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Party from '../../characters/party/Party.js';

/**
 * @module game/commands/party/PartyDecline
 */

/**
 * An action that causes you to decline a party
 */
class PartyDecline {

  /**
   * Create a new PartyDecline action
   *
   * @param {String} target - The target of the decline
   */
  constructor(target) {
    this.target = target;
  }

  /**
   * Execute the command on the character
   *
   * @param {Character} character - The character to execute on
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

    targetParty.removeInvitee(character);
    character.sendImmediate(`You decline to join ${this.target}'s party.`);
    targetParty.leader.sendImmediate(`${character.toShortText()} declines to join your party.`);
  }

}

export { PartyDecline };