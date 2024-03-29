//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { ErrorAction } from './Error.js';

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
   * @param {Character} character - The character to execute on
   */
  async execute(character) {
    const room = character.room;
    if (!room) {
      character.sendImmediate('You are floating in a void.');
      return;
    }

    let container;
    if (this.container) {
      const itemsOnPlayer = character.findItemsOnCharacter(this.container);
      if (itemsOnPlayer.length > 1) {
        character.sendImmediate(`Which ${this.container} do you want to get ${this.target} from?`);
        return;
      } else if (itemsOnPlayer.length === 1) {
        container = itemsOnPlayer[0].item;
      } else {
        container = character.inanimates.findItem(this.container);
      }

      if (!container) {
        container = room.inanimates.findItem(this.container);
      }

      if (!container) {
        character.sendImmediate(`${this.container} does not exist`);
        return;
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
      const item = container.inanimates.findItem(this.target);
      if (!item) {
        character.sendImmediate(`${this.target} is not in ${container.name}`);
        return;
      }
      items.push(item);
    } else {
      items.push(...container.inanimates.filter(f => f));
    }

    if (items.length === 0) {
      character.sendImmediate('There is nothing here for you to get.');
      return;
    }

    items.forEach((item) => {
      if (!container.removeItem(item)) {
        character.sendImmediate(`You cannot remove ${item.name} from ${container.name}`);
      } else {
        let itemName;

        if (item.isCurrency) {
          const { name, quantity } = item.model.currencyProperties;
          itemName = item.model.description;
          character.currencies.deposit(name, quantity);
          item.destroy();

          character.sendImmediate(`You ${this.container ? 'take' : 'pick up'} ${itemName}${this.container ? ` from ${container.name}` : ''}`);
        } else {
          itemName = item.toShortText();

          character.addHauledItem(item);
          character.sendImmediate(`You put ${itemName} in your inventory`);
        }

        if (container.sendImmediate) {
          container.sendImmediate([character], `${character.name} picks up ${itemName}`);
        }
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
    return 'get';
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
      return new ErrorAction({ message: 'What do you want to get?' });
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