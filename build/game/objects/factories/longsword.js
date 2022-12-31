"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const WeaponModel_js_1 = __importDefault(require("../../../db/models/WeaponModel.js"));
const Weapon_js_1 = __importDefault(require("../Weapon.js"));
/**
 * @module game/objects/factories/longsword
 */
/**
 * Create a new longsword
 *
 * @returns {Weapon}
 */
const longswordFactory = async (data = {}) => {
    const model = new WeaponModel_js_1.default();
    model.name = data.name ?? 'longsword';
    model.description = data.description ?? 'A sword with both a long blade and grip, allowing both one and two-handed use.';
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
            return {
                modifierType: modifier.type,
                value: modifier.value,
                modifier: modifier.modifier ?? 0,
            };
        });
    }
    await model.save();
    const weapon = new Weapon_js_1.default(model);
    await weapon.load();
    return weapon;
};
exports.default = longswordFactory;
