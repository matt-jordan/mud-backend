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
 * @module game/objects/factories/mace
 */

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

export default maceFactory;