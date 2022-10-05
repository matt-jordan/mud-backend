//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import InanimateModel from '../../../db/models/InanimateModel.js';
import Inanimate from '../Inanimate.js';

/**
 * @module game/objects/factories/corpses
 */

/**
 * Create a new corpse from a given character
 *
 * @param {Character} character - The character to create a corpse from
 *
 * @returns {Inanimate}
 */
const corpseFactory = async (character) => {

  const destructionTime = 300;

  const model = new InanimateModel();
  model.name = `${character.toShortText()}'s corpse`;
  model.description = `The corpse of ${character.toShortText()}`;
  model.weight = character.weight;
  model.isContainer = true;
  model.containerProperties.weightReduction = 0;
  model.containerProperties.weightCapacity = 1000; // Just something large
  model.durability.current = Math.ceil(model.weight / 10);
  model.durability.base = Math.ceil(model.weight / 10);
  model.destructionTime = destructionTime;

  await model.save();

  const corpse = new Inanimate(model);
  await corpse.load();

  return corpse;
};


export default corpseFactory;