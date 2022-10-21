//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Party from '../../characters/Party.js';

/**
 * @module game/commands/party/PartyStatus
 */

/**
 * An action that shows your party status
 */
class PartyStatus {

  /**
   * Create a new PartyStatus action
   */
  constructor() {
  }

  /**
   * Display details about a party
   *
   * @param {Character} character - The character who wants to know their
   *                                party's status
   */
  async execute(character) {
    const party = Party.getParty(character);
    if (!party) {
      character.sendImmediate('You are not in a party.');
      return;
    }

    character.sendImmediate({ messageType: 'PartyStatus', message: party.toJson() });
  }

}

export { PartyStatus };