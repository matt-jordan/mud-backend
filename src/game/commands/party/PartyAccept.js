//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

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


}

export { PartyAccept };