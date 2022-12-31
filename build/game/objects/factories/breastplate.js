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
 * @module game/objects/factories/breastplate
 */
/**
 * Create new breastplate
 *
 * @returns {Armor}
 */
const breastplateFactory = async (data = {}) => {
    const { material = 'steel' } = data;
    const model = new ArmorModel_js_1.default();
    model.name = `${material} breastplate`;
    model.description = `This is a breastplate made of ${material}. It is worn on the body, and protects the chest and stomach.`;
    model.weight = 20;
    model.dexterityPenalty = (0, materials_js_1.materialToDexterityPenalty)(material);
    model.armorClass = (0, materials_js_1.materialToAc)(material);
    model.wearableLocations.push('body');
    model.durability.current = (0, materials_js_1.materialToDurability)(material);
    model.durability.base = (0, materials_js_1.materialToDurability)(material);
    await model.save();
    const armor = new Armor_js_1.default(model);
    await armor.load();
    return armor;
};
exports.default = breastplateFactory;
