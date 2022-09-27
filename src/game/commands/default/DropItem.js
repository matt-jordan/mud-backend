//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { ErrorAction } from './Error.js';
import currencyFactory from '../../objects/factories/currency.js';

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
   * @param {String} target   - The item in the player's inventory to drop
   * @param {Number} quantity - If a currency or stack, how many items to drop
   */
  constructor(target, quantity) {
    this.target = target;
    this.quantity = quantity;
  }

  /**
   * Execute the command on the player character
   *
   * @param {Character} character - The player to execute on
   */
  async execute(character) {
    if (!character.room) {
      character.sendImmediate('You are floating in a void.');
      return;
    }

    let item;

    if (Number.isInteger(this.quantity)) {
      const quantity = character.currencies.withdraw(this.target, this.quantity);
      if (!quantity) {
        character.sendImmediate(`You do not have ${this.quantity} ${this.target}`);
        return;
      }

      item = await currencyFactory({ name: this.target, quantity });
    } else {
      item = character.inanimates.findAndRemoveItem(this.target);
      if (!item) {
        character.sendImmediate(`You do not have ${this.target}`);
        return;
      }
    }
    character.room.addItem(item);
    character.sendImmediate(`You drop ${item.name}`);
    character.room.sendImmediate([character], `${character.name} drops ${item.name}`);
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
    return 'drop';
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
      return new ErrorAction({ message: 'What do you want to drop?' });
    }

    const quantity = parseInt(tokens[0], 10);
    if (!isNaN(quantity)) {
      if (tokens.length === 1) {
        return new ErrorAction({ message: 'What kind of currency do you want to drop?'});
      }
      if (quantity <= 0) {
        return new ErrorAction({ message: `${quantity} is not a valid amount to drop.`});
      }
      const currency = tokens.slice(1, tokens.length);
      return new DropItemAction(currency.join(' '), quantity);
    }

    return new DropItemAction(tokens.join(' '));
  }
}

export {
  DropItemAction,
  DropItemFactory,
};