//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import CharacterModel from '../../db/models/CharacterModel.js';
import Animal from './Animal.js';
import Human from './Human.js';
import PlayerCharacter from './PlayerCharacter.js';
import NonPlayableCharacter from './NonPlayableCharacter.js';

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

  const model = await CharacterModel.findById(characterId);
  if (!model) {
    return null;
  }

  let character;
  if (model.accountId) {
    const pc = PlayerCharacter(Human);
    character = new pc(model, world);
  } else {
    let npcClass;

    switch (model.race) {
    case 'animal':
      npcClass = Animal;
      break;
    case 'human':
      npcClass = Human;
      break;
    default:
      return null;
    }

    const npc = NonPlayableCharacter(npcClass);
    character = new npc(model, world);
  }

  await character.load();
  return character;
}

export default loadCharacter;