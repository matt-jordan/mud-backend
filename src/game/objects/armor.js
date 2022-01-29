//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { loadInanimate } from './inanimates.js';
import asyncForEach from '../../lib/asyncForEach.js';
import ArmorModel from '../../db/models/Armor.js';

/**
 * @module game/objects/armor
 */

/**
 * A class that implements a piece of armor
 */
class Armor {

  /**
   * Create a new piece of armor
   *
   * @param {ArmorModel} model - The model for this armor
   */
  constructor(model) {
    this.model = model;
    this.durability = {
      current: 1,
      base: 1,
    };
    this.inanimates = [];
    this._weight = 0;
    this.onWeightChangeCb = null;
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
   * The weight of the item
   *
   * @returns {Number}
   */
  get weight() {
    return this._weight;
  }

  /**
   * Add an item to be carried
   *
   * @param {Object} item - The item to add to this container
   *
   * @returns {Boolean} True if the item could be added, false otherwise
   */
  addItem(item) {
    if (!this.model.isContainer) {
      return false;
    }

    if (item.id === this.id) {
      return false;
    }

    const reducedWeight = item.weight * (1 - this.model.containerProperties.weightReduction / 100);
    if (this._weight + reducedWeight > this.model.containerProperties.weightCapacity) {
      return false;
    }

    if (this.onWeightChangeCb) {
      this.onWeightChangeCb(this, this._weight, (this._weight + reducedWeight));
    }

    this._weight += reducedWeight;
    this.inanimates.push(item);
    return true;
  }

  /**
   * Remove a carried item
   *
   * @param {Object} item - The item to remove from this container
   *
   * @returns {Boolean} True if the item could be removed, false otherwise
   */
  removeItem(item) {
    if (!this.model.isContainer) {
      return false;
    }

    const index = this.inanimates.indexOf(item);
    if (index === -1) {
      return false;
    }

    const reducedWeight = item.weight * (1 - this.model.containerProperties.weightReduction / 100);

    if (this.onWeightChangeCb) {
      this.onWeightChangeCb(this, this._weight, (this._weight - reducedWeight));
    }

    this._weight -= reducedWeight;
    this.inanimates.splice(index, 1);
    return true;
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
   * Returns whether or not this item is a container
   *
   * @returns {Boolean}
   */
  get isContainer() {
    return this.model.isContainer;
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
    this._weight = this.model.weight;
    if (this.model.isContainer) {
      await asyncForEach(this.model.inanimates, async (inanimateDef) => {
        const inanimate = await loadInanimate(inanimateDef);
        if (inanimate) {
          this.addItem(inanimate);
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
    this.model.inanimates = this.inanimates.map((inanimate) => {
      return {
        inanimateId: inanimate.id,
        inanimateType: inanimate.itemType,
      };
    });

    await this.model.save();
  }
}

/**
 * Create a new backpack
 *
 * @returns {Armor}
 */
const backpackFactory = async () => {
  const model = new ArmorModel();
  model.name = 'Backpack';
  model.description = 'A backpack, useful for carrying things.';
  model.weight = 1;
  model.dexterityPenalty = 0;
  model.armorClass = 0;
  model.wearableLocations.push('back');
  model.isContainer = true;
  model.containerProperties.weightCapacity = 40;
  model.durability.current = 10;
  model.durability.base = 10;
  await model.save();

  const armor = new Armor(model);
  await armor.load();

  return armor;
};

export {
  Armor,
  backpackFactory,
};
