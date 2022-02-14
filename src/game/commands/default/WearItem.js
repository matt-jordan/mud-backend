//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { textToPhysicalLocation, physicalLocationToText } from '../../../lib/physicalLocation.js';

/**
 * @module game/commands/default/WearItem
 */

/**
 * Class that allows a player to wear items they are carrying
 */
class WearItemAction {

  /**
   * Create a new WearItemAction
   *
   * @param {String} target     - The item to wear
   * @param {String} [location] - The body location to wear the item (optional)
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
    if (!character.room) {
      character.sendImmediate('You are floating in a void.');
      return;
    }

    let location;
    if (this.location) {
      location = textToPhysicalLocation(this.location);
      if (!location) {
        character.sendImmediate(`${this.location} is not a place on your body`);
        return;
      }

      if (character.physicalLocations[location].item) {
        character.sendImmediate(`You are already wearing something on your ${this.location}`);
        return;
      }
    }

    const item = character.inanimates.findItem(this.target);
    if (!item) {
      character.sendImmediate(`You are not carrying ${this.target}`);
      return;
    }

    if (item.wearableLocations.length === 0) {
      character.sendImmediate(`You cannot wear ${this.target}`);
      return;
    }

    if (location) {
      if (!item.wearableLocations.includes(location)) {
        character.sendImmediate(`You cannot wear ${this.target} on your ${this.location}`);
        return;
      }
    } else {
      const possibleLocations = item.wearableLocations.filter((loc) => character.physicalLocations[loc].item === null);
      if (possibleLocations.length !== 1) {
        character.sendImmediate(`Where would you like to wear ${this.target}?`);
        return;
      }
      location = possibleLocations[0];
    }

    // TODO: Need to check level, attributes, and class restrictions. This should
    // like just be in the character, who can do all those checks and send messages

    character.physicalLocations[location].item = item;
    character.removeHauledItem(item);

    let verb;
    let preposition;
    if (item.itemType === 'weapon' || item.isShield) {
      verb = 'wield';
      preposition = 'with';
    } else {
      verb = 'put';
      preposition = 'on';
    }

    character.sendImmediate(`You ${verb} ${item.toShortText()} ${preposition} your ${physicalLocationToText(location)}`);
    character.room.sendImmediate([character], `${character.toShortText()} ${verb}s ${item.toShortText()} ${preposition} ${character.pronoun} ${physicalLocationToText(location)}`);
  }
}

/**
 * Class that generates WearItemAction from player input
 */
class WearItemFactory {

  /**
   * The unique name that maps this factory to the player's command
   *
   * @return {String}
   */
  static get name() {
    return 'Wear';
  }

  /**
   * Create a new WearItemFactory
   */
  constructor() {
  }

  /**
   * Generate a WearItemAction from player input
   *
   * @param {Array<String>} tokens - The player input
   *
   * @returns {WearItemAction}
   */
  generate(tokens = []) {
    if (!tokens || tokens.length === 0) {
      return null;
    }

    let action;
    const index = tokens.indexOf('on');
    if (index === -1) {
      action = new WearItemAction(tokens.join(' '));
    } else {
      const target = tokens.splice(0, index);
      tokens.splice(0, 1);
      action = new WearItemAction(target.join(' '), tokens.join(' '));
    }

    return action;
  }
}

export {
  WearItemAction,
  WearItemFactory
};
