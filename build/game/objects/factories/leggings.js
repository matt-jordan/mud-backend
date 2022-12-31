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
 * @module game/objects/factories/leggings
 */
/**
 * Create new leggings
 *
 * @returns {Armor}
 */
const leggingsFactory = async (data = {}) => {
    const { material = 'cloth' } = data;
    const model = new ArmorModel_js_1.default();
    model.name = `${material} leggings`;
    model.description = `These are leggings made of ${material}.`;
    model.weight = 1;
    model.dexterityPenalty = (0, materials_js_1.materialToDexterityPenalty)(material);
    model.armorClass = (0, materials_js_1.materialToAc)(material);
    model.wearableLocations.push('legs');
    model.durability.current = (0, materials_js_1.materialToDurability)(material);
    model.durability.base = (0, materials_js_1.materialToDurability)(material);
    await model.save();
    const armor = new Armor_js_1.default(model);
    await armor.load();
    return armor;
};
exports.default = leggingsFactory;
