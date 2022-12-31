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
const inanimateRefSchema_js_1 = __importDefault(require("./schemas/inanimateRefSchema.js"));
const modifierSchema_js_1 = __importDefault(require("./schemas/modifierSchema.js"));
;
;
;
const armorSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    description: { type: String },
    armorClass: { type: Number, default: 0 },
    dexterityPenalty: { type: Number, default: 0 },
    wearableLocations: [{ type: String, enum: ['head', 'body', 'neck', 'hands', 'legs', 'feet', 'leftFinger', 'rightFinger', 'leftHand', 'rightHand', 'back'] }],
    isShield: { type: Boolean, default: false },
    isContainer: { type: Boolean, default: false },
    inanimates: [{ type: inanimateRefSchema_js_1.default }],
    containerProperties: {
        weightReduction: { type: Number, default: 0 },
        weightCapacity: { type: Number, default: 10 },
    },
    classRestriction: [{ type: String }],
    levelRestriction: { type: Number, default: 0 },
    weight: { type: Number, default: 1, required: true },
    size: { type: String, default: 'medium', enum: ['small', 'medium', 'large'] },
    durability: {
        current: { type: Number, default: 10 },
        base: { type: Number, default: 10 },
    },
    modifiers: [{ type: modifierSchema_js_1.default }],
});
const ArmorModel = mongoose_1.default.model('Armor', armorSchema);
exports.default = ArmorModel;
