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
 * @module game/objects/factories/robe
 */

/**
 * Create new robe
 *
 * @returns {Armor}
 */
const robeFactory = async () => {
  const model = new ArmorModel();
  model.name = 'robe';
  model.description = 'This is a loose cloth robe, the preferred garment of wizards.';
  model.weight = 1;
  model.dexterityPenalty = 0;
  model.armorClass = 0;
  model.wearableLocations.push('body');
  model.durability.current = 10;
  model.durability.base = 10;
  await model.save();

  const armor = new Armor(model);
  await armor.load();

  return armor;
};

export default robeFactory;
