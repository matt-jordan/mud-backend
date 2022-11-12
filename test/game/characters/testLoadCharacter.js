//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import CharacterModel from '../../../build/db/models/CharacterModel.js';
import loadCharacter from '../../../build/game/characters/loadCharacter.js';
import { createWorld, destroyWorld } from '../fixtures.js';

describe('loadCharacter', () => {

  let world;
  let model;

  beforeEach(async () => {
    const results = await createWorld();
    world = results.world;
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('unknown characters', () => {
    it('returns null', async () => {
      const uut = await loadCharacter({ world, characterId: '01fd45ed160121867a1e8990' });
      assert(uut === null);
    });
  });

  describe('unknown types', () => {
    beforeEach(async () => {
      model = new CharacterModel();
      model.name = 'cat';
      model.age = 1;
      model.weight = 10;
      model.roomId = world.areas[0].rooms[0].id;
      model.race = 'nopity';
      model.size = 'small';
      model.attributes = {
        strength: { base: 4, },
        dexterity: { base: 12 },
        constitution: { base: 4 },
        intelligence: { base: 6 },
        wisdom: { base: 4 },
        charisma: { base: 2 },
        hitpoints: { base: 2, current: 2 },
        manapoints: { base: 0, current: 0 },
        energypoints: { base: 80, current: 80 },
      };
      await model.save();
    });

    it('returns null', async () => {
      const uut = await loadCharacter({ world, characterId: model._id.toString() });
      assert(uut === null);
    });
  });

  ['human', 'animal'].forEach((characterType) => {
    describe(characterType, () => {
      beforeEach(async () => {
        model = new CharacterModel();
        model.name = 'test';
        model.age = 1;
        model.weight = 10;
        model.roomId = world.areas[0].rooms[0].id;
        model.race = characterType;
        model.attributes = {
          strength: { base: 4, },
          dexterity: { base: 12 },
          constitution: { base: 4 },
          intelligence: { base: 6 },
          wisdom: { base: 4 },
          charisma: { base: 2 },
          hitpoints: { base: 2, current: 2 },
          manapoints: { base: 0, current: 0 },
          energypoints: { base: 80, current: 80 },
        };
        await model.save();
      });

      it('returns the character', async () => {
        const uut = await loadCharacter({ world, characterId: model._id.toString() });
        assert(uut);
        assert(uut.model.race === characterType);
      });
    });
  });
});
