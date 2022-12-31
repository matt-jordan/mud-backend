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
 * @module game/objects/factories/cap
 */
/**
 * Create a new cap
 *
 * @returns {Armor}
 */
const capFactory = async (data = {}) => {
    const { material = 'cloth' } = data;
    const model = new ArmorModel_js_1.default();
    model.name = `${material} cap`;
    model.description = `This is a cap made of ${material}. It provides some protection for the head, and looks fashionable while doing so.`;
    model.weight = 1;
    model.dexterityPenalty = 0;
    model.armorClass = (0, materials_js_1.materialToAc)(material);
    model.wearableLocations.push('head');
    model.durability.current = (0, materials_js_1.materialToDurability)(material);
    model.durability.base = (0, materials_js_1.materialToDurability)(material);
    await model.save();
    const armor = new Armor_js_1.default(model);
    await armor.load();
    return armor;
};
exports.default = capFactory;
