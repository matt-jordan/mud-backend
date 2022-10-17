//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

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

}

export { PartyDecline };