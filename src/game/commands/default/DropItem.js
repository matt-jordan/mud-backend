//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

/**
 * @module game/commands/default/DropItem
 */

/**
 * Command action that causes a player character to drop an item
 */
class DropItemAction {

  /**
   * Create a new DropItemAction
   *
   * @param {String} target - The item in the player's inventory to drop
   */
  constructor(target) {
    this.target = target;
  }

  /**
   * Execute the command on the player character
   *
   * @param {PlayerCharacter} character - The player to execute on
   */
  execute(character) {
    if (!character.room) {
      character.sendImmediate('You are floating in a void.');
      return;
    }

    const item = character.inanimates.find(item => item.name === this.target);
    if (!item) {
      character.sendImmediate(`You do not have ${this.target}`);
      return;
    }

    character.removeHauledItem(item);
    character.room.addItem(item);
    character.sendImmediate(`You drop ${this.target}`);
    character.room.sendImmediate(character, `${character.name} drops ${this.target}`);
  }

}

/**
 * Factory that generates DropItemAction objects
 */
class DropItemFactory {

  /**
   * The mapping of this factory to the player command
   */
  static get name() {
    return 'Drop';
  }

  /**
   * Create a new factory
   */
  constructor() {
  }

  /**
   * Generate the DropItemAction from player input
   */
  generate(tokens = []) {
    if (!tokens || tokens.length === 0) {
      return null;
    }

    return new DropItemAction(tokens.join(' '));
  }
}

export {
  DropItemAction,
  DropItemFactory,
};