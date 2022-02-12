//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

/**
 * @module game/objects/Weapon
 */

/**
 * A class that implements a weapon
 */
class Weapon {

  /**
   * Create a new weapon
   *
   * @param {WeaponModel} The database model for the weapon
   */
  constructor(model) {
    this.model = model;
    this.durability = {
      current: 1,
      base: 1,
    };
  }

  /**
   * A high level typing of this inanimate. Used primarily when serializing things around
   *
   * @return {String}
   */
  get itemType() {
    return 'weapon';
  }

  /**
   * The ID of the weapon
   *
   * @returns {String}
   */
  get id() {
    return this.model._id.toString();
  }

  /**
   * The name of the weapon
   *
   * @returns {String}
   */
  get name() {
    return this.model.name;
  }

  /**
   * A description of the weapon
   *
   * @returns {String}
   */
  get description() {
    return this.model.description;
  }

  /**
   * The weight of the weapon
   *
   * @returns {Number}
   */
  get weight() {
    return this.model.weight;
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
   * The minimum damage of the weapon
   *
   * @returns {Number}
   */
  get minDamage() {
    return this.model.minDamage;
  }

  /**
   * The maximum damage of the weapon
   *
   * @returns {Number}
   */
  get maxDamage() {
    return this.model.maxDamage;
  }

  /**
   * A short description of the weapon
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
   * Load the weapon from the database model
   */
  async load() {
    this.durability.current = this.model.durability.current;
    this.durability.base = this.model.durability.base;
  }

  /**
   * Save the weapon to the database model
   */
  async save() {
    this.model.durability.current = this.durability.current;
    this.model.durability.base = this.durability.base;
    await this.model.save();
  }
}

export default Weapon;
