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
import { materialToAc, materialToDurability } from './helpers/materials.js';
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
const shieldFactory = (data = {}) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { material = 'steel', size = 'medium' } = data;
    const model = new ArmorModel();
    model.name = (_a = data.name) !== null && _a !== void 0 ? _a : `${size} ${material} shield`;
    model.description = (_b = data.description) !== null && _b !== void 0 ? _b : `This is a ${size} shield made of ${material}. It is held and used to block attacks.`;
    model.size = size;
    model.weight = 10;
    model.dexterityPenalty = 0;
    model.armorClass = materialToAc(material);
    model.isShield = true;
    model.wearableLocations.push('leftHand');
    model.wearableLocations.push('rightHand');
    model.durability.current = materialToDurability(material) * 1.5;
    model.durability.base = materialToDurability(material) * 1.5;
    yield model.save();
    const armor = new Armor(model);
    yield armor.load();
    return armor;
});
export default shieldFactory;
