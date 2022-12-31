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
exports.loadInanimate = void 0;
const ArmorModel_js_1 = __importDefault(require("../../db/models/ArmorModel.js"));
const Armor_js_1 = __importDefault(require("./Armor.js"));
const WeaponModel_js_1 = __importDefault(require("../../db/models/WeaponModel.js"));
const Weapon_js_1 = __importDefault(require("./Weapon.js"));
const InanimateModel_js_1 = __importDefault(require("../../db/models/InanimateModel.js"));
const Inanimate_js_1 = __importDefault(require("./Inanimate.js"));
const log_js_1 = __importDefault(require("../../lib/log.js"));
/**
 * Loads an inanimate object and its model and returns an instantiated object
 *
 * @param {Object} param
 * @param {Object.ObjectId} inanimateId - The Database ID of the object
 * @param {Object.String} inanimateType - The type of object to create
 *
 * @returns {Weapon} One of Weapon, Armor
 */
async function loadInanimate(param) {
    const { inanimateId, inanimateType } = param;
    let inanimate;
    let inanimateModel;
    switch (inanimateType) {
        case 'inanimate':
            inanimateModel = await InanimateModel_js_1.default.findById(inanimateId);
            inanimate = new Inanimate_js_1.default(inanimateModel);
            break;
        case 'armor':
            inanimateModel = await ArmorModel_js_1.default.findById(inanimateId);
            inanimate = new Armor_js_1.default(inanimateModel);
            break;
        case 'weapon':
            inanimateModel = await WeaponModel_js_1.default.findById(inanimateId);
            inanimate = new Weapon_js_1.default(inanimateModel);
            break;
        default:
            log_js_1.default.error({ roomName: this.name, inanimateType }, 'Unknown inanimate type');
            return null;
    }
    if (inanimateModel && inanimate) {
        await inanimate.load();
        return inanimate;
    }
    else {
        log_js_1.default.warn({ inanimateId, inanimateType }, 'Unable to load model for inanimate');
    }
    return null;
}
exports.loadInanimate = loadInanimate;
