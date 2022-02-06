//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import SpawnerModel from '../../../../src/db/models/SpawnerModel.js';
import Spawner from '../../../../src/game/characters/spawners/Spawner.js';
import { createWorld, destroyWorld } from '../../fixtures.js'; 

describe('Spawner', () => {

  let model;
  let character;
  let world;

  beforeEach(async () => {
    const result = await createWorld();
    world = result.world;
    character = result.pc1;

    model = new SpawnerModel();
    model.characterFactories.push('RatFactory');
    await model.save();
  });

  afterEach(async () => {
    await SpawnerModel.deleteMany();
    await destroyWorld();
  });

  describe('load', () => {
    beforeEach(async () => {
      model.state = {};
      model.state.characterIds = [];
      model.state.characterIds.push(character.id);
      model.state.currentTick = 10;
      await model.save();
    });

    it('loads the current state', async () => {
      const uut = new Spawner(model, world.areas[0].rooms[0]);
      assert(uut);
      await uut.load();
      assert(uut.currentTick === 10);
      assert(uut.characters.length === 1);
      assert(uut.characters[0].id === character.id);
    });
  });

  describe('save', () => {
    it('saves the current state', async () => {
      const uut = new Spawner(model, world.areas[0].rooms[0]);
      assert(uut);
      uut.characters.push(character);
      uut.currentTick = 10;
      await uut.save();

      const newModel = await SpawnerModel.findById(model._id.toString());
      assert(newModel);
      assert(newModel.state);
      assert(newModel.state.currentTick === uut.currentTick);
      assert(newModel.state.characterIds[0] === uut.characters[0].id);
    });
  });

});