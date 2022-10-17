//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

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

}

export { PartyInvite };