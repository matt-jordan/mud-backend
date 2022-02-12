//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { loadInanimate, InanimateContainer } from './inanimates.js';
import asyncForEach from '../../lib/asyncForEach.js';

/**
 * An inanimate object that isn't worn (like armor) or wielded (like weapons)
 */
class Inanimate {

  /**
   * Create a new inaninate object
   *
   * @param {InanimateModel} model - The mode underpinning this object
   */
  constructor(model) {
    this.model = model;
    this.durability = {
      current: 1,
      base: 1,
    };
    this.inanimates = new InanimateContainer();
    this._weight = 0;
    this.onWeightChangeCb = null;
  }

  /**
   * A high level typing of this inanimate. Used primarily when serializing things around
   *
   * @return {String}
   */
  get itemType() {
    return 'inanimate';
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
    this.inanimates.addItem(item);
    return true;
  }

  /**
   * Remove a carried item
   *
   * @param {Object} _item - The item to remove from this container
   *
   * @returns {Boolean} True if the item could be removed, false otherwise
   */
  removeItem(_item) {
    if (!this.model.isContainer) {
      return false;
    }

    const item = this.inanimates.findAndRemoveItem(_item.name);
    if (!item) {
      return false;
    }

    const reducedWeight = item.weight * (1 - this.model.containerProperties.weightReduction / 100);
    if (this.onWeightChangeCb) {
      this.onWeightChangeCb(this, this._weight, (this._weight - reducedWeight));
    }
    this._weight -= reducedWeight;

    return true;
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
   * A full description of the armor
   *
   * @return {String}
   */
  toLongText() {
    return `${this.name}\n${this.model.description}`;
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
    this.model.inanimates = this.inanimates.all.map((inanimate) => {
      return {
        inanimateId: inanimate.id,
        inanimateType: inanimate.itemType,
      };
    });

    await this.model.save();
  }

}

export default Inanimate;