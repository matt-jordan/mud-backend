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
 * @module game/objects/factories/corpses
 */
/**
 * Create a new corpse from a given character
 *
 * @param {Character} character - The character to create a corpse from
 *
 * @returns {Inanimate}
 */
const corpseFactory = (character) => __awaiter(void 0, void 0, void 0, function* () {
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
    yield model.save();
    const corpse = new Inanimate(model);
    yield corpse.load();
    return corpse;
});
export default corpseFactory;
