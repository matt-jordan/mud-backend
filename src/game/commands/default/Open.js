//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

/**
 * @module game/commands/default/Open
 */

class OpenAction {

  /**
   * Create a new open action
   *
   * @param {String} target - The intended door to open
   */
  constructor(target) {
    this.target = target;
  }

  /**
   * Execute the action on the character
   *
   * @param {Character} character - The character to execute the action on
   */
  async execute(character) {
    if (!character.room) {
      character.sendImmediate('You are floating in a void.');
      return;
    }

    const door = character.room.getDoor(this.target);
    if (!door) {
      character.sendImmediate(`You do not see a ${this.target} here`);
      return;
    }

    if (door.hasLock && door.isLocked) {
      character.sendImmediate(`The ${this.target} is locked.`);
      return;
    }

    if (door.isOpen) {
      character.sendImmediate(`The ${this.target} is already open.`);
      return;
    }

    door.isOpen = true;
    character.sendImmediate(`You open the ${door.toShortText()}.`);
    character.room.sendImmediate([character], `${character.toShortText()} opens the ${door.toShortText()}.`);
  }
}

class OpenFactory {

  /**
   * The unique name that maps this factory to the player's command
   *
   * @return {String}
   */
  static get name() {
    return 'open';
  }

  /**
   * Create a new factory
   */
  constructor() {
  }

  /**
   * Generate a OpenAction
   *
   * @returns {OpenAction}
   */
  generate(tokens) {
    return new OpenAction(tokens.join(' '));
  }
}

export {
  OpenAction,
  OpenFactory,
};
