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
 * @module game/objects/factories/currency
 */

/**
 * Create a pile of some currency
 *
 * @returns {Inanimate}
 */
const currencyFactory = async (data = {}) => {
  const { name, quantity } = data;

  const model = new InanimateModel();
  model.name = `${name}${quantity > 1 ? ` (${quantity})` : ''}`;
  model.description = `${quantity === 1 ? 'a' : `${quantity}`} ${name} coin${quantity > 1 ? 's' : ''}`;
  model.weight = .01 * quantity;
  model.isCurrency = true;
  model.currencyProperties = {
    name,
    quantity,
  };
  model.durability.current = 1;
  model.durability.base = 1;
  await model.save();

  const coins = new Inanimate(model);
  await coins.load();

  return coins;
};

export default currencyFactory;