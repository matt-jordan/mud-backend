//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import CharacterModel from '../../db/models/Character.js';
import Animal from './animal.js';
import PlayerCharacter from './playerCharacter.js';


/**
 * Load a character from the database
 *
 * This factory-esque function infers the type from the database model and
 * creates the appropriate objects.
 *
 * @param {Object} params
 * @param {String} params.characterId - The ID of the character to load
 * @param {Object} params.world       - The world to load the character into
 *
 * @returns {Object}
 */
async function loadCharacter(params) {
  const { characterId, world } = params;

  const model = await CharacterModel.findById(characterId);
  if (!model) {
    return null;
  }

  let character;
  switch (model.race) {
  case 'animal':
    character = new Animal(model, world);
    break;
  case 'human':
    character = new PlayerCharacter(model, world);
    break;
  default:
    return null;
  }

  await character.load();
  return character;
}

export default loadCharacter;