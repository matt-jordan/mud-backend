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
const CharacterModel_js_1 = __importDefault(require("../../db/models/CharacterModel.js"));
const Animal_js_1 = __importDefault(require("./Animal.js"));
const Human_js_1 = __importDefault(require("./Human.js"));
const PlayerCharacter_js_1 = __importDefault(require("./PlayerCharacter.js"));
/**
 * @module game/characters/loadCharacter
 */
/**
 * Load a character from the database
 *
 * This factory-esque function infers the type from the database model and
 * creates the appropriate objects.
 *
 * @param {Object} params
 * @param {String}  params.characterId - The ID of the character to load
 * @param {Object}  params.world       - The world to load the character into
 *
 * @returns {Object}
 */
async function loadCharacter(params) {
    const { characterId, world } = params;
    const model = await CharacterModel_js_1.default.findById(characterId);
    if (!model) {
        return null;
    }
    let character;
    if (model.accountId) {
        character = new PlayerCharacter_js_1.default(model, world);
    }
    else {
        switch (model.race) {
            case 'animal':
                character = new Animal_js_1.default(model, world);
                break;
            case 'human':
                character = new Human_js_1.default(model, world);
                break;
            default:
                return null;
        }
    }
    await character.load();
    return character;
}
exports.default = loadCharacter;
