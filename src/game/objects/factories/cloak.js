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
 * @module game/objects/factories/cloak
 */

/**
 * Create a new cloak
 *
 * @returns {Armor}
 */
const cloakFactory = async (data = {}) => {
  const { material = 'cloth' } = data;

  const model = new ArmorModel();
  model.name = `${material} cloak`;
  model.description = `This is a cloak made of ${material}. It is worn on the back, and mostly looks stylish.`;
  model.weight = 1;
  model.dexterityPenalty = 0;
  model.armorClass = materialToAc(material);
  model.wearableLocations.push('back');
  model.durability.current = materialToDurability(material);
  model.durability.base = materialToDurability(material);
  await model.save();

  const armor = new Armor(model);
  await armor.load();

  return armor;
};

export default cloakFactory;
