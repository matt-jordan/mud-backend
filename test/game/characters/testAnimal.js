//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Animal from '../../../src/game/characters/Animal.js';
import CharacterModel from '../../../src/db/models/Character.js';
import { createWorld, destroyWorld } from '../fixtures.js';

describe('Animal', () => {

  let world;
  let model;

  beforeEach(async () => {
    const results = await createWorld();
    world = results.world;

    model = new CharacterModel();
    model.name = 'cat';
    model.age = 1;
    model.weight = 10;
    model.roomId = world.areas[0].rooms[0].id;
    model.race = 'animal';
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

  afterEach(async () => {
    await destroyWorld();
  });

  describe('creating from a model and world', () => {
    it('creates the animal and puts it in the world', async () => {
      const cat = new Animal(model, world);
      await cat.load();
      assert(cat);
      assert(cat.name === 'cat');
      assert(cat.room !== null);
    });
  });

  describe('toShorText', () => {
    it('includes a proper summary', async () => {
      const cat = new Animal(model, world);
      await cat.load();
      assert(cat);
      assert(cat.toShortText() === 'a cat');
    });
  });

  describe('onTick', () => {
    it('moves the character when it should', async () => {
      const cat = new Animal(model, world);
      cat.moveChance = 0;
      await cat.load();
      assert(cat);
      await cat.onTick();
      assert(cat.room.id === world.areas[0].rooms[1].id);
    });
  });
});
