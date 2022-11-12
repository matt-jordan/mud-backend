//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const currencyFactory = (data = {}) => __awaiter(void 0, void 0, void 0, function* () {
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
    yield model.save();
    const coins = new Inanimate(model);
    yield coins.load();
    return coins;
});
export default currencyFactory;
