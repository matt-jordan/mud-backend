//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import PlayerCharacter from '../../characters/playerCharacter.js';

/**
 * @module game/commands/default/GetItem
 */

/**
 * Action that handles getting items from the world or objects
 */
class GetItemAction {

  /**
   * Create a new GetItemAction
   *
   * @param {String} target      - The item to get
   * @param {String} [container] - Optional. The place to look for the item
   */
  constructor(target, container) {
    this.target = target;
    this.container = container;
  }

  /**
   * Execute the action on the character
   *
   * @param {PlayerCharacter} character - The character to execute on
   */
  async execute(character) {
    const room = character.room;
    if (!room) {
      character.sendImmediate('You are floating in a void.');
      return;
    }

    let container;
    if (this.container) {
      const location = PlayerCharacter.physicalLocations.find(location =>
        character.physicalLocations[location].item
        && character.physicalLocations[location].item.name === this.container);
      if (location) {
        container = character.physicalLocations[location].item;
      } else {
        container = character.inanimates.find(item => item.name === this.container);
        if (!container) {
          container = room.inanimates.find(item => item.name === this.container);
          if (!container) {
            character.sendImmediate(`${this.container} does not exist`);
            return;
          }
        }
      }

      if (!container.isContainer) {
        character.sendImmediate(`${this.container} is not a container`);
        return;
      }
    } else {
      container = room;
    }

    const items = [];
    if (this.target !== 'all') {
      const item = container.inanimates.find(i => i.name === this.target);
      if (!item) {
        character.sendImmediate(`${this.target} is not in ${container.name}`);
        return;
      }
      items.push(item);
    } else {
      items.push(...container.inanimates);
    }

    items.forEach((item) => {
      if (!container.removeItem(item)) {
        character.sendImmediate(`You cannot remove ${item.name} from ${container.name}`);
      } else {
        character.addHauledItem(item);
        character.sendImmediate(`You put ${item.name} in your inventory`);
      }
    });
  }
}

/**
 * Factory for generating GetItemAction from player text
 */
class GetItemFactory {

  /**
   * The mapping of this factory to the player command
   */
  static get name() {
    return 'Get';
  }

  /**
   * Create a new factory
   */
  constructor() {
  }

  /**
   * Generate a GetItemAction from the provided player input
   *
   * @param {Array.<String>} tokens - The text the player provided
   *
   * @return {GetItemAction} On success the action to execute, or null
   */
  generate(tokens) {
    if (!tokens || tokens.length === 0) {
      return null;
    }

    let action;
    const index = tokens.indexOf('from');
    if (index === -1) {
      action = new GetItemAction(tokens.join(' '));
    } else {
      const target = tokens.splice(0, index);
      tokens.splice(0, 1);
      action = new GetItemAction(target.join(' '), tokens.join(' '));
    }

    return action;
  }
}

export {
  GetItemAction,
  GetItemFactory,
};