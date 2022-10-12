//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Character from '../characters/Character.js';

class StunAction {
  #character;

  constructor({ character, ticks = 1, }) {
    this.#character = character;
    this.ticks = ticks;
  }

  /**
   * The verbs associated with the action we're performing
   */
  get verbs() {
    return {
      firstPerson: 'stun',
      thirdPerson: 'stuns',
    };
  }

  /**
   * Adjective describing the state of the character
   */
  get adjective() {
    return 'stunned';
  }

  /**
   * The type of action this is
   *
   * @returns {String}
   */
  get actionType() {
    return 'effect';
  }

  /**
   * Check if the player can perform the requested action
   *
   * @param {String} action - The type of action being requested.
   *
   * @returns {Boolean} True if they can perform the action, false otherwise
   */
  checkAction(action) {
    switch (action) {
    case 'move':
    case 'rest':
    case 'attack':
      // If the character is in combat, they already know they're stunned.
      if (this.#character.currentState !== Character.STATE.FIGHTING) {
        this.#character.sendImmediate(`You cannot ${action}, you are stunned!`);
      }
      return false;
    default:
      return true;
    }
  }

  /**
   * Callback called when this action is first added to a character
   */
  onInitialPush() {
    this.#character.sendImmediate('You are stunned!');
  }

  /**
   * Callback called when this action is no longer in effect on a character
   */
  onExpire() {
    this.#character.sendImmediate('You are no longer stunned.');
  }

}



export default StunAction;
