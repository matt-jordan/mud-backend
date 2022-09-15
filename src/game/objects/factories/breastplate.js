//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { materialToAc, materialToDexterityPenalty, materialToDurability } from './helpers/materials.js';
import ArmorModel from '../../../db/models/ArmorModel.js';
import Armor from '../Armor.js';

/**
 * @module game/objects/factories/breastplate
 */

/**
 * Create new breastplate
 *
 * @returns {Armor}
 */
const breastplateFactory = async (data = {}) => {
  const { material = 'steel' } = data;

  const model = new ArmorModel();
  model.name = `${material} breastplate`;
  model.description = `This is a breastplate made of ${material}. It is worn on the body, and protects the chest and stomach.`;
  model.weight = 20;
  model.dexterityPenalty = materialToDexterityPenalty(material);
  model.armorClass = materialToAc(material);
  model.wearableLocations.push('body');
  model.durability.current = materialToDurability(material);
  model.durability.base = materialToDurability(material);
  await model.save();

  const armor = new Armor(model);
  await armor.load();

  return armor;
};

export default breastplateFactory;
