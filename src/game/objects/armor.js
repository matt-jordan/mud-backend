//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { loadInanimate } from './inanimates.js';
import asyncForEach from '../../lib/asyncForEach.js';

/**
 * @module game/objects/armor
 */

/**
 * A class that implements a piece of armor
 */
class Armor {


  constructor(model) {
    this.model = model;
    this.durability = {
      current: 1,
      base: 1,
    };
    this.items = [];
  }

  /**
   * A high level typing of this inanimate. Used primarily when serializing things around
   *
   * @return {String}
   */
  get itemType() {
    return 'armor';
  }

  /**
   * The ID of the armor
   *
   * @returns {String}
   */
  get id() {
    return this.model._id.toString();
  }

  /**
   * The name of the armor
   *
   * @returns {String}
   */
  get name() {
    return this.model.name;
  }

  /**
   * Get an array of the locations that this item can be worn
   *
   * @returns {Array<String>}
   */
  get wearableLocations() {
    return this.model.wearableLocations;
  }

  /**
   * A short description of the armor
   *
   * @returns {String}
   */
  toShortText() {
    return this.name;
  }

  /**
   * Check to see if a player can wear this particular piece of armor
   *
   * @param {PlayerCharacter} character - The character attempting to wear the thing
   *
   * @return {Object} Response object
   *         {Object.result} True if the player can wear it, false otherwise
   *         {Object.reason} String reason if the player cannot wear the item
   */
  checkCanPlayerUse(character) {
    // Check wearable locations, and if the character has a free slot
    const location = this.model.wearableLocations.find((location) => character.physicalLocations[location].item === null);
    if (!location) {
      return { result: false, reason: 'No wearable location available' };
    }

    // TODO: Check level restrictions

    // TODO: Check class restrictions
    return { result: true };
  }

  /**
   * Load the armor from the database model
   */
  async load() {
    this.durability.current = this.model.durability.current;
    this.durability.base = this.model.durability.base;
    if (this.model.isContainer) {
      await asyncForEach(this.model.inanimates, async (inanimateDef) => {
        const inanimate = await loadInanimate(inanimateDef);
        if (inanimate) {
          this.items.push(inanimate);
        }
      });
    }
  }

  /**
   * Save the current attributes to the model
   */
  async save() {
    this.model.durability.current = this.durability.current;
    this.model.durability.base = this.durability.base;
    this.model.inanimates = this.items.map((inanimate) => {
      return {
        inanimateId: inanimate.id,
        inanimateType: inanimate.itemType,
      };
    });

    await this.model.save();
  }
}

export {
  Armor,
};
