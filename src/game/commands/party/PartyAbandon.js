//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Party from '../../characters/party/Party.js';

/**
 * @module game/commands/party/PartyAbandon
 */

/**
 * An action that causes you to abandon a party
 */
class PartyAbandon {

  /**
   * Create a new PartyAbandon action
   */
  constructor() {
  }

  /**
   * Execute the command on the player
   *
   * @param {Character} character - The character to execute on
   */
  async execute(character) {
    const party = Party.getParty(character);
    if (!party || party.leader !== character) {
      character.sendImmediate('You are not leading a party.');
      return;
    }

    await party.destroy(true);
  }
}

export { PartyAbandon };