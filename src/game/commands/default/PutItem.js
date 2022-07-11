//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { ErrorAction } from './Error.js';
import Character from '../../characters/Character.js';
import { inanimateNameComparitor } from '../../objects/inanimates.js';
import { textToPhysicalLocation } from '../../../lib/physicalLocation.js';
import log from '../../../lib/log.js';

/**
 * @module game/commands/default/Put
 */

/**
 * An action that puts item into another item that the player carries
 */
class PutItemAction {

  /**
   * Create a new PutItemAction
   *
   * @param {String} source      - The object to move
   * @param {String} destination - The object to put it into
   * @param {String} [location]  - The object destination location
   *
   * @returns {PutItemAction}
   */
  constructor(source, destination, location = null) {
    this.source = source;
    this.destination = destination;
    this.location = location;
  }

  /**
   * Execute the action on the character
   *
   * @param {Character} character - The player character
   */
  execute(character) {
    const sourceItem = character.inanimates.findItem(this.source);
    if (!sourceItem) {
      character.sendImmediate(`You are not carrying ${this.source}`);
      return;
    }

    let destinationItem;
    if (!this.location) {
      destinationItem = character.inanimates.findItem(this.destination);
      if (!destinationItem) {
        character.sendImmediate(`You are not carrying ${this.destination}`);
        return;
      }
    } else {
      const locationName = textToPhysicalLocation(this.location);

      if (!(Character.physicalLocations.includes(this.location))) {
        character.sendImmediate(`${this.location} is not a valid location`);
        return;
      }

      destinationItem = character.physicalLocations[locationName].item;
      if (!destinationItem) {
        character.sendImmediate(`You are not wearing anything on ${this.location}`);
        return;
      }
      if (!inanimateNameComparitor(destinationItem.name, this.destination)) {
        character.sendImmediate(`You are not wearing ${this.destination} on your ${this.location}`);
        return;
      }
    }

    if (!character.removeHauledItem(sourceItem)) {
      log.warn({ characterId: character.id, sourceItemId: sourceItem.id }, 'Failed to remove hauled item');
      return;
    }
    if (!destinationItem.addItem(sourceItem)) {
      character.sendImmediate(`You cannot put ${sourceItem.toShortText()} in ${destinationItem.toShortText()}`);
      character.addHauledItem(sourceItem);
      return;
    } else {
      character.sendImmediate(`You put ${sourceItem.toShortText()} in ${destinationItem.toShortText()}`);
    }

  }
}

/**
 * Factory that generates PutItemAction objects
 */
class PutItemFactory {
  /**
   * The mapping of this factory to the player command
   *
   * @return {String}
   */
  static get name() {
    return 'put';
  }

  /**
   * Create a new factory
   */
  constructor() {
  }

  /**
   * Generate a MoveAction from the provided player input
   *
   * @param {Array.<String>} tokens - The text the player provided
   *
   * @return {MoveAction} On success, the action to execute, or null
   */
  generate(tokens) {
    if (tokens.length === 0) {
      return new ErrorAction({ message: 'What do you want to put?' });
    }

    const index = tokens.indexOf('in');
    if (index === -1) {
      return new ErrorAction({ message: `What do you want to put ${tokens.join(' ')} in?` });
    }

    const source = tokens.slice(0, index);
    let destination = tokens.slice(index + 1, tokens.length);
    if (!source || source.length === 0) {
      return new ErrorAction({ message: `What do you want to put in ${destination.join(' ')}?` });
    }
    if (!destination || destination.length === 0) {
      return new ErrorAction({ message: `What do you want to put ${source.join(' ')} in?` });
    }

    const locIndex = destination.indexOf('on');
    let location = [];
    if (locIndex !== -1) {
      location = destination.slice(locIndex + 1, destination.length);
      destination = destination.slice(0, locIndex);

      if (!location || location.length === 0) {
        return new ErrorAction({ message: `What ${destination.join(' ')} do you want to put ${source.join(' ')} in?` });
      }
    }

    return new PutItemAction(source.join(' '), destination.join(' '), location.join(' '));
  }

}

export {
  PutItemAction,
  PutItemFactory,
};