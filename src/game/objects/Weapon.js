//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import WeaponModel from '../../db/models/WeaponModel.js';

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

/**
 * Create a new mace
 *
 * @returns {Weapon}
 */
const maceFactory = async () => {
  const model = new WeaponModel();
  model.name = 'Mace';
  model.description = 'A blunt weapon with a heavy head on the end of a metal handle.';
  model.damageType = 'bludgeoning';
  model.weaponType = 'simple';
  model.wearableLocations.push('leftHand');
  model.wearableLocations.push('rightHand');
  model.classRestriction.push('fighter');
  model.classRestriction.push('rogue');
  model.classRestriction.push('priest');
  model.weight = 4;
  model.minDamage = 1;
  model.maxDamage = 6;
  model.durability.current = 20;
  model.durability.base = 20;
  await model.save();

  const weapon = new Weapon(model);
  await weapon.load();

  return weapon;
};

/**
 * Create a new shortsword
 *
 * @returns {Weapon}
 */
const shortswordFactory = async () => {
  const model = new WeaponModel();
  model.name = 'Shortsword';
  model.description = 'A light one-handed sword used for thrusting.';
  model.properties.push('light');
  model.properties.push('finesse');
  model.damageType = 'piercing';
  model.weaponType = 'martial';
  model.wearableLocations.push('leftHand');
  model.wearableLocations.push('rightHand');
  model.classRestriction.push('fighter');
  model.classRestriction.push('rogue');
  model.weight = 2;
  model.minDamage = 1;
  model.maxDamage = 4;
  model.durability.current = 20;
  model.durability.base = 20;
  await model.save();

  const weapon = new Weapon(model);
  await weapon.load();

  return weapon;
};

/**
 * Create a new longsword
 *
 * @returns {Weapon}
 */
const longswordFactory = async () => {
  const model = new WeaponModel();
  model.name = 'Longsword';
  model.description = 'A sword with both a long blade and grip, allowing both one and two-handed use.';
  model.properties.push('versatile');
  model.damageType = 'slashing';
  model.weaponType = 'martial';
  model.wearableLocations.push('leftHand');
  model.wearableLocations.push('rightHand');
  model.classRestriction.push('fighter');
  model.weight = 3;
  model.minDamage = 1;
  model.maxDamage = 8;
  model.durability.current = 25;
  model.durability.base = 25;
  await model.save();

  const weapon = new Weapon(model);
  await weapon.load();

  return weapon;
};

export {
  Weapon,
  longswordFactory,
  maceFactory,
  shortswordFactory,
};