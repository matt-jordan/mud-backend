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
 * @module game/objects/factories/mace
 */
/**
 * Create a new mace
 *
 * @returns {Weapon}
 */
const maceFactory = async () => {
    const model = new WeaponModel_js_1.default();
    model.name = 'mace';
    model.description = 'A blunt weapon with a heavy head on the end of a metal handle.';
    model.damageType = 'bludgeoning';
    model.weaponType = 'simple';
    model.wearableLocations.push('leftHand');
    model.wearableLocations.push('rightHand');
    model.classRestriction.push('fighter');
    model.classRestriction.push('rogue');
    model.classRestriction.push('priest');
    model.weight = 4;
    model.minDamage = 1;
    model.maxDamage = 6;
    model.durability.current = 20;
    model.durability.base = 20;
    await model.save();
    const weapon = new Weapon_js_1.default(model);
    await weapon.load();
    return weapon;
};
exports.default = maceFactory;
