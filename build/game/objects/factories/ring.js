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
 * @module game/objects/factories/ring
 */
/**
 * Create a new ring
 *
 * @returns {Armor}
 */
const ringFactory = (data = {}) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const model = new ArmorModel();
    model.name = (_a = data.name) !== null && _a !== void 0 ? _a : 'ring';
    model.description = (_b = data.description) !== null && _b !== void 0 ? _b : 'A small metal band worn on a finger.';
    model.weight = 0;
    model.dexterityPenalty = 0;
    model.armorClass = 0;
    model.wearableLocations.push('leftFinger');
    model.wearableLocations.push('rightFinger');
    model.durability.current = 5;
    model.durability.base = 5;
    if (data.modifiers) {
        model.modifiers = data.modifiers.map(modifier => {
            var _a;
            return {
                modifierType: modifier.type,
                value: modifier.value,
                modifier: (_a = modifier.modifier) !== null && _a !== void 0 ? _a : 0,
            };
        });
    }
    yield model.save();
    const armor = new Armor(model);
    yield armor.load();
    return armor;
});
export default ringFactory;
