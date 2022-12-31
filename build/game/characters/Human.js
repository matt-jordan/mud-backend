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
const Character_js_1 = __importDefault(require("./Character.js"));
class Human extends Character_js_1.default {
    /**
     * Create a new human character
     *
     * @param {CharacterModel} model - The model for the human character
     * @param {World}          world - The one and only world
     */
    constructor(model, world) {
        super(model, world);
        // All humans are proficient in common
        this.skills.set('common', 100);
    }
}
exports.default = Human;
