//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Character from '../../characters/Character.js';
import { textToPhysicalLocation, physicalLocationToText } from '../../../lib/physicalLocation.js';

/**
 * @module game/commands/default/RemoveItem
 */

/**
 * Class that removes an item from a player
 */
class RemoveItemAction {

  /**
   * Create a new RemoveItemAction
   *
   * @param {String} target     - The item to remove
   * @param {String} [location] - The body location to remove the item from (optional)
   */
  constructor(target, location) {
    this.target = target;
    this.location = location;
  }

  /**
   * Execute the action on the character
   *
   * @param {Character} character - The character to execute the action on
   */
  async execute(character) {
    let item;
    let location;

    if (!character.room) {
      character.sendImmediate('You are floating in a void.');
      return;
    }

    if (this.location) {
      location = textToPhysicalLocation(this.location);
      if (!location) {
        character.sendImmediate(`${this.location} is not a place on your body.`);
        return;
      }

      item = character.removeItemOnCharacter(this.target, location);
      if (!item) {
        character.sendImmediate(`You are not wearing ${this.target} on your ${this.location}`);
        return;
      }
    } else {
      const candidates = character.findItemsOnCharacter(this.target);
      if (candidates.length === 0) {
        character.sendImmediate(`You are not wearing ${this.target}.`);
        return;
      }
      if (candidates.length > 1) {
        character.sendImmediate(`Which ${this.target} do you want to remove?`);
        return;
      }
      item = character.removeItemOnCharacter(candidates[0].item.name, candidates[0].location);
      location = candidates[0].location;
      if (!item) {
        character.sendImmediate(`You are not wearing ${this.target}`);
        return;
      }
    }

    let verb;
    let preposition;

    if (item.itemType === 'weapon' || item.isShield) {
      verb = 'wielding';
      preposition = 'with';
    } else {
      verb = 'wearing';
      preposition = 'on';
    }

    character.addHauledItem(item);
    character.sendImmediate(`You stop ${verb} ${item.toShortText()} ${preposition} your ${physicalLocationToText(location)}`);
    character.room.sendImmediate(character, `${character.toShortText()} stops ${verb} ${item.toShortText()} ${preposition} ${character.pronoun} ${physicalLocationToText(location)}`);
  }
}

/**
 * Class that generates RemoveItemAction from player input
 */
class RemoveItemFactory {

  /**
   * The unique name that maps this factory to the player's command
   *
   * @return {String}
   */
  static get name() {
    return 'Remove';
  }

  /**
   * Create a new RemoveItemFactory
   */
  constructor() {
  }

  /**
   * Generate a RemoveItemAction from player input
   *
   * @param {Array<String>} tokens - The player input
   *
   * @returns {RemoveItemAction}
   */
  generate(tokens = []) {
    if (!tokens || tokens.length === 0) {
      return null;
    }

    let action;
    const index = tokens.indexOf('from');
    if (index === -1) {
      action = new RemoveItemAction(tokens.join(' '));
    } else {
      const target = tokens.splice(0, index);
      tokens.splice(0, 1);
      action = new RemoveItemAction(target.join(' '), tokens.join(' '));
    }

    return action;
  }

}

export {
  RemoveItemAction,
  RemoveItemFactory,
};
