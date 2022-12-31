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
const materials_js_1 = require("./helpers/materials.js");
const ArmorModel_js_1 = __importDefault(require("../../../db/models/ArmorModel.js"));
const Armor_js_1 = __importDefault(require("../Armor.js"));
/**
 * @module game/objects/factories/shield
 */
/**
 * Create a new shield
 *
 * @returns {Armor}
 */
const shieldFactory = async (data = {}) => {
    const { material = 'steel', size = 'medium' } = data;
    const model = new ArmorModel_js_1.default();
    model.name = data.name ?? `${size} ${material} shield`;
    model.description = data.description ?? `This is a ${size} shield made of ${material}. It is held and used to block attacks.`;
    model.size = size;
    model.weight = 10;
    model.dexterityPenalty = 0;
    model.armorClass = (0, materials_js_1.materialToAc)(material);
    model.isShield = true;
    model.wearableLocations.push('leftHand');
    model.wearableLocations.push('rightHand');
    model.durability.current = (0, materials_js_1.materialToDurability)(material) * 1.5;
    model.durability.base = (0, materials_js_1.materialToDurability)(material) * 1.5;
    await model.save();
    const armor = new Armor_js_1.default(model);
    await armor.load();
    return armor;
};
exports.default = shieldFactory;
