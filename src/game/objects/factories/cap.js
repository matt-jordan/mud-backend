//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { materialToAc, materialToDurability } from './helpers/materials.js';
import ArmorModel from '../../../db/models/ArmorModel.js';
import Armor from '../Armor.js';

/**
 * @module game/objects/factories/cap
 */

/**
 * Create a new cap
 *
 * @returns {Armor}
 */
const capFactory = async (material) => {
  const model = new ArmorModel();
  model.name = `${material} cap`;
  model.description = `This is a cap made of ${material}. It provides some protection for the head, and looks fashionable while doing so.`;
  model.weight = 1;
  model.dexterityPenalty = 0;
  model.armorClass = materialToAc(material);
  model.wearableLocations.push('head');
  model.durability.current = materialToDurability(material);
  model.durability.base = materialToDurability(material);
  await model.save();

  const armor = new Armor(model);
  await armor.load();

  return armor;
};

export default capFactory;
