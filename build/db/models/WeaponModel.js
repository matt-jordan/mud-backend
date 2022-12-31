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
const mongoose_1 = __importDefault(require("mongoose"));
const modifierSchema_js_1 = __importDefault(require("./schemas/modifierSchema.js"));
;
const weaponSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    description: { type: String },
    properties: [{ type: String, enum: ['ammunition', 'finesse', 'heavy', 'light', 'loading', 'range', 'reach', 'two-handed', 'versatile'] }],
    damageType: { type: String, required: true, enum: ['piercing', 'slashing', 'bludgeoning'] },
    weaponType: { type: String, required: true, enum: ['simple', 'martial', 'exotic'] },
    classRestriction: [{ type: String }],
    levelRestriction: { type: Number, default: 0, },
    weight: { type: Number, default: 1, required: true },
    minDamage: { type: Number, default: 1 },
    maxDamage: { type: Number, default: 1 },
    wearableLocations: [{ type: String, enum: ['leftHand', 'rightHand'] }],
    modifiers: [{ type: modifierSchema_js_1.default }],
    durability: {
        current: { type: Number, default: 10 },
        base: { type: Number, default: 10 },
    },
});
const WeaponModel = mongoose_1.default.model('Weapon', weaponSchema);
exports.default = WeaponModel;
