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
const Human_js_1 = __importDefault(require("./Human.js"));
/**
 * Class representing a playable character
 */
class PlayerCharacter extends Human_js_1.default {
    /**
     * Create a new playable character
     *
     * @param {CharacterModel} model - The model for the playable character
     * @param {World}          world - The one and only world
     */
    constructor(model, world) {
        super(model, world);
        // TODO: We should make this dynamic
        // this.factions.initializeFaction('Adventurer\'s Guild', 50);
        // NOTE: We should pull out some of the non-playercharacter stuff out of
        // the Character baseclass, e.g., all the transport manipulation
    }
}
exports.default = PlayerCharacter;
