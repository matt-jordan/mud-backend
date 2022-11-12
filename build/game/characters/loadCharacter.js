//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import CharacterModel from '../../db/models/CharacterModel.js';
import Animal from './Animal.js';
import Human from './Human.js';
import PlayerCharacter from './PlayerCharacter.js';
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
function loadCharacter(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { characterId, world } = params;
        const model = yield CharacterModel.findById(characterId);
        if (!model) {
            return null;
        }
        let character;
        if (model.accountId) {
            character = new PlayerCharacter(model, world);
        }
        else {
            switch (model.race) {
                case 'animal':
                    character = new Animal(model, world);
                    break;
                case 'human':
                    character = new Human(model, world);
                    break;
                default:
                    return null;
            }
        }
        yield character.load();
        return character;
    });
}
export default loadCharacter;
