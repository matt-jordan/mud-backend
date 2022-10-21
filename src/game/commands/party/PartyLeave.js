//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Party from '../../characters/Party.js';

/**
 * @module game/commands/party/PartyLeave
 */

/**
 * An action that causes you to leave a party
 */
class PartyLeave {

  /**
   * Create a new PartyLeave action
   */
  constructor() {
  }

  /**
   * Execute the command on the character
   *
   * @param {Character} character - The character executing the command
   */
  async execute(character) {
    const party = Party.getParty(character);
    if (!party) {
      character.sendImmediate('You are not in a party.');
      return;
    }

    if (party.leader === character) {
      character.sendImmediate('You cannot leave the party, you are leading it.');
      return;
    }

    if (!party.removeMember(character)) {
      character.sendImmediate(`You failed to leave ${party.leader.toShortText()}'s party.`);
      return;
    }
    character.sendImmediate(`You have left ${party.leader.toShortText()}'s party.`);
    party.leader.sendImmediate(`${character.toShortText()} has left your party.`);
  }

}

export { PartyLeave };