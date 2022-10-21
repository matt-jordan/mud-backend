//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Party from '../../characters/Party.js';

/**
 * @module game/commands/party/PartyCreate
 */

/**
 * An action that causes you to create a party
 */
class PartyCreate {

  /**
   * Create a new PartyCreate action
   */
  constructor() {
  }

  /**
   * Create a new party based on the character
   */
  async execute(character) {
    const party = Party.getParty(character);
    if (party) {
      if (party.leader === character) {
        character.sendImmediate('You are already leading a party.');
      } else {
        character.sendImmediate(`You are already in ${party.leader.toShortText()}'s party.`);
      }
      return;
    }

    await Party.createParty(character);
    character.sendImmediate('You form a party.');
  }
}

export { PartyCreate };