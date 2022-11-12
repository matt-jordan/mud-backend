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
import ArmorModel from '../../../db/models/ArmorModel.js';
import Armor from '../Armor.js';
/**
 * @module game/objects/factories/backpack
 */
/**
 * Create a new backpack
 *
 * @returns {Armor}
 */
const backpackFactory = () => __awaiter(void 0, void 0, void 0, function* () {
    const model = new ArmorModel();
    model.name = 'backpack';
    model.description = 'A backpack, useful for carrying things.';
    model.weight = 1;
    model.dexterityPenalty = 0;
    model.armorClass = 1;
    model.wearableLocations.push('back');
    model.isContainer = true;
    model.containerProperties.weightCapacity = 40;
    model.durability.current = 10;
    model.durability.base = 10;
    yield model.save();
    const armor = new Armor(model);
    yield armor.load();
    return armor;
});
export default backpackFactory;
