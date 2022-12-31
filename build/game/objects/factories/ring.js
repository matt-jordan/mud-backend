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
const ArmorModel_js_1 = __importDefault(require("../../../db/models/ArmorModel.js"));
const Armor_js_1 = __importDefault(require("../Armor.js"));
/**
 * @module game/objects/factories/ring
 */
/**
 * Create a new ring
 *
 * @returns {Armor}
 */
const ringFactory = async (data = {}) => {
    const model = new ArmorModel_js_1.default();
    model.name = data.name ?? 'ring';
    model.description = data.description ?? 'A small metal band worn on a finger.';
    model.weight = 0;
    model.dexterityPenalty = 0;
    model.armorClass = 0;
    model.wearableLocations.push('leftFinger');
    model.wearableLocations.push('rightFinger');
    model.durability.current = 5;
    model.durability.base = 5;
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
    const armor = new Armor_js_1.default(model);
    await armor.load();
    return armor;
};
exports.default = ringFactory;
