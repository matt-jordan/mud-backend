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
 * @module game/objects/factories/leggings
 */

/**
 * Create new leggings
 *
 * @returns {Armor}
 */
const leggingsFactory = async (data = {}) => {
  const { material = 'cloth' } = data;

  const model = new ArmorModel();
  model.name = `${material} leggings`;
  model.description = `These are leggings made of ${material}.`;
  model.weight = 1;
  model.dexterityPenalty = materialToDexterityPenalty(material);
  model.armorClass = materialToAc(material);
  model.wearableLocations.push('legs');
  model.durability.current = materialToDurability(material);
  model.durability.base = materialToDurability(material);
  await model.save();

  const armor = new Armor(model);
  await armor.load();

  return armor;
};

export default leggingsFactory;
