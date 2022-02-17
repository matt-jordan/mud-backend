//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import WeaponModel from '../../../db/models/WeaponModel.js';
import Weapon from '../Weapon.js';

/**
 * @module game/objects/factories/shortsword
 */

/**
 * Create a new shortsword
 *
 * @returns {Weapon}
 */
const shortswordFactory = async () => {
  const model = new WeaponModel();
  model.name = 'shortsword';
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

export default shortswordFactory;