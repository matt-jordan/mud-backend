//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import ArmorModel from '../../../db/models/ArmorModel.js';
import Armor from '../Armor.js';

/**
 * @module game/objects/factories/ring
 */

/**
 * Create a new ring
 *
 * @returns {Armor}
 */
const ringFactory = async () => {
  const model = new ArmorModel();
  model.name = 'Ring';
  model.description = 'A small metal band worn on a finger.';
  model.weight = 0;
  model.dexterityPenalty = 0;
  model.armorClass = 0;
  model.wearableLocations.push('leftFinger');
  model.wearableLocations.push('rightFinger');
  model.durability.current = 5;
  model.durability.base = 5;
  await model.save();

  const armor = new Armor(model);
  await armor.load();

  return armor;
};

export default ringFactory;
