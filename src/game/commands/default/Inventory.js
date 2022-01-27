//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import PlayerCharacter from '../../characters/playerCharacter.js';

/**
 * @module game/commands/default/Inventory
 */

/**
 * Format a location item
 *
 * @param {Object} locationObject
 * @param {Object} locationObject.item - The item to format
 *
 * @returns {String}
 */
function formatLocationValue(locationObject) {
  if (locationObject && locationObject.item) {
    return locationObject.item.toShortText();
  } else {
    return 'Nothing';
  }
}

/**
 * Format a location to human text
 *
 * @param {String} location - The playerCharacter physical location to format
 *
 * @returns {String}
 */
function physicalLocationToText(location) {
  switch(location) {
  case 'head':
    return 'Head';
  case 'body':
    return 'Body';
  case 'neck':
    return 'Neck';
  case 'hands':
    return 'Hands';
  case 'legs':
    return 'Legs';
  case 'feet':
    return 'Feet';
  case 'leftFinger':
    return 'Left Finger';
  case 'rightFinger':
    return 'Right Finger';
  case 'leftHand':
    return 'Left Hand';
  case 'rightHand':
    return 'Right Hand';
  case 'back':
    return 'Back';
  default:
    return 'Unknown';
  }
}


/**
 * Inventory action
 */
class InventoryAction {

  /**
   * Create a new InventoryAction
   */
  constructor() {

  }

  /**
   * Execute the Inventory action on the character
   *
   * @param {PlayerCharacter} character - The character to execute on
   */
  async execute(character) {
    let ret;

    ret = 'Inventory:\n';
    PlayerCharacter.physicalLocations.forEach((location) => {
      ret += `  ${physicalLocationToText(location)}: ${formatLocationValue(character.physicalLocations[location])}\n`;
    });

    character.sendImmediate(`${ret}`);
    return;
  }

}

/**
 * Factory class for generating Inventory actions
 */
class InventoryFactory {

  /**
   * This mapping of this factory to the player command
   *
   * @returns {String}
   */
  static get name() {
    return 'Inventory';
  }

  /**
   * Create a new factory
   */
  constructor() {
  }

  /**
   * Generate an InventoryAction from the provided player input
   *
   * @param {Array.<String>} tokens - The text the player provided
   *
   * @return {LookAction} On success, the action to execute, or null
   */
  generate() {
    return new InventoryAction();
  }

}

export {
  InventoryAction,
  InventoryFactory,
};
