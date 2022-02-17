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
 * @module game/objects/factories/shirt
 */

/**
 * Create a new shirt
 *
 * @returns {Armor}
 */
const shirtFactory = async () => {
  const model = new ArmorModel();
  model.name = 'shirt';
  model.description = 'A well-made cloth shirt.';
  model.weight = 0.25;
  model.dexterityPenalty = 0;
  model.armorClass = 0;
  model.wearableLocations.push('body');
  model.durability.current = 5;
  model.durability.base = 5;
  await model.save();

  const armor = new Armor(model);
  await armor.load();

  return armor;
};

export default shirtFactory;
