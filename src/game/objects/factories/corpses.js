//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import InanimateModel from '../../../db/models/InanimateModel.js';
import Inanimate from '../Inanimate.js';

const corpseFactory = async (character) => {

  const model = new InanimateModel();
  model.name = `${character.toShortText()}'s corpse`;
  model.description = `The corpse of ${character.toShortText()}`;
  model.weight = character.weight;
  model.isContainer = true;
  model.containerProperties.weightReduction = 0;
  model.containerProperties.weightCapacity = 1000; // Just something large
  model.durability.current = Math.ceil(model.weight / 10);
  model.durability.base = Math.ceil(model.weight / 10);

  await model.save();

  const corpse = new Inanimate(model);
  await corpse.load();

  return corpse;
};


export default corpseFactory;