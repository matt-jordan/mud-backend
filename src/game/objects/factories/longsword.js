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
 * @module game/objects/factories/longsword
 */

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

export default longswordFactory;