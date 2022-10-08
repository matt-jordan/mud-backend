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
 * @module game/objects/factories/shield
 */

/**
 * Create a new shield
 *
 * @returns {Armor}
 */
const shieldFactory = async (data = {}) => {
  const { material = 'steel', size = 'medium' } = data;

  const model = new ArmorModel();
  model.name = data.name ?? `${size} ${material} shield`;
  model.description = data.description ?? `This is a ${size} shield made of ${material}. It is held and used to block attacks.`;
  model.size = size;
  model.weight = 10;
  model.dexterityPenalty = 0;
  model.armorClass = materialToAc(material);
  model.isShield = true;
  model.wearableLocations.push('leftHand');
  model.wearableLocations.push('rightHand')
  model.durability.current = materialToDurability(material) * 1.5;
  model.durability.base = materialToDurability(material) * 1.5;
  await model.save();

  const armor = new Armor(model);
  await armor.load();

  return armor;
};

export default shieldFactory;
