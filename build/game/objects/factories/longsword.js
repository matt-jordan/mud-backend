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
import WeaponModel from '../../../db/models/WeaponModel.js';
import Weapon from '../Weapon.js';
/**
 * @module game/objects/factories/longsword
 */
/**
 * Create a new longsword
 *
 * @returns {Weapon}
 */
const longswordFactory = (data = {}) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const model = new WeaponModel();
    model.name = (_a = data.name) !== null && _a !== void 0 ? _a : 'longsword';
    model.description = (_b = data.description) !== null && _b !== void 0 ? _b : 'A sword with both a long blade and grip, allowing both one and two-handed use.';
    model.properties.push('versatile');
    model.damageType = 'slashing';
    model.weaponType = 'martial';
    model.wearableLocations.push('leftHand');
    model.wearableLocations.push('rightHand');
    model.classRestriction.push('fighter');
    model.weight = 3;
    model.minDamage = 1;
    model.maxDamage = 8;
    model.durability.current = 25;
    model.durability.base = 25;
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
    const weapon = new Weapon(model);
    yield weapon.load();
    return weapon;
});
export default longswordFactory;
