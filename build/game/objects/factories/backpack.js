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
 * @module game/objects/factories/backpack
 */
/**
 * Create a new backpack
 *
 * @returns {Armor}
 */
const backpackFactory = async () => {
    const model = new ArmorModel_js_1.default();
    model.name = 'backpack';
    model.description = 'A backpack, useful for carrying things.';
    model.weight = 1;
    model.dexterityPenalty = 0;
    model.armorClass = 1;
    model.wearableLocations.push('back');
    model.isContainer = true;
    model.containerProperties.weightCapacity = 40;
    model.durability.current = 10;
    model.durability.base = 10;
    await model.save();
    const armor = new Armor_js_1.default(model);
    await armor.load();
    return armor;
};
exports.default = backpackFactory;
