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
const backpack_js_1 = __importDefault(require("./backpack.js"));
const boots_js_1 = __importDefault(require("./boots.js"));
const breastplate_js_1 = __importDefault(require("./breastplate.js"));
const cap_js_1 = __importDefault(require("./cap.js"));
const cloak_js_1 = __importDefault(require("./cloak.js"));
const gloves_js_1 = __importDefault(require("./gloves.js"));
const leggings_js_1 = __importDefault(require("./leggings.js"));
const longsword_js_1 = __importDefault(require("./longsword.js"));
const mace_js_1 = __importDefault(require("./mace.js"));
const ring_js_1 = __importDefault(require("./ring.js"));
const robe_js_1 = __importDefault(require("./robe.js"));
const shield_js_1 = __importDefault(require("./shield.js"));
const shirt_js_1 = __importDefault(require("./shirt.js"));
const shortsword_js_1 = __importDefault(require("./shortsword.js"));
/**
 * @module game/objects/factories/index
 */
const factoryMap = {
    backpack: backpack_js_1.default,
    breastplate: breastplate_js_1.default,
    boots: boots_js_1.default,
    cap: cap_js_1.default,
    cloak: cloak_js_1.default,
    gloves: gloves_js_1.default,
    leggings: leggings_js_1.default,
    longsword: longsword_js_1.default,
    mace: mace_js_1.default,
    ring: ring_js_1.default,
    robe: robe_js_1.default,
    shield: shield_js_1.default,
    shirt: shirt_js_1.default,
    shortsword: shortsword_js_1.default,
};
/**
 * Obtain a factory by the thing that it generates
 *
 * @param {String} factory - The object factory to obtain
 *
 * @returns {Object} a factory
 */
const objectFactories = (factory) => {
    if (!(factory in factoryMap)) {
        throw Error(`${factory} does not exist`);
    }
    return factoryMap[factory];
};
exports.default = objectFactories;
