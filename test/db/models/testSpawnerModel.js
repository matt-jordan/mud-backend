//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import SpawnerModel from '../../../src/db/models/SpawnerModel.js';

describe('SpawnerModel', () => {
  afterEach(async () => {
    await SpawnerModel.deleteMany();
  });

  describe('findByLoadId', () => {
    let spawner;

    beforeEach(async () => {
      spawner = new SpawnerModel();
      spawner.characterFactories.push('Rats');
      spawner.characterSelection = 'random';
      spawner.triggerType = 'tick';
      spawner.triggerUpperLimit = 10;
      spawner.spawnsPerTrigger = 2;
      spawner.loadInfo.loadId = 'spawn-1';
      spawner.loadInfo.version = 0;
      await spawner.save();
    });

    it('returns null if the spawner is not found', async () => {
      const uut = await SpawnerModel.findByLoadId('does-not-exist');
      assert(uut === null);
    });

    it('returns the spawner if it is found', async () => {
      const uut = await SpawnerModel.findByLoadId('spawn-1');
      assert(uut);
      assert(spawner.characterFactories.length === 1);
      assert(spawner.characterFactories[0] === 'Rats');
      assert(spawner.characterSelection === 'random');
      assert(spawner.triggerType === 'tick');
      assert(spawner.triggerUpperLimit === 10);
      assert(spawner.spawnsPerTrigger === 2);
    });
  });

  describe('updateFromLoad', () => {
    let spawner;

    beforeEach(async () => {
      spawner = new SpawnerModel();
      spawner.characterFactories.push('RatFactory');
      spawner.loadInfo.version = 0;
      spawner.loadInfo.loadId = 'spawner-1';
      await spawner.save();
    });

    it('does not update if the version is not later', async () => {
      const uut = {
        triggerUpperLimit: 15,
        version: 0,
        loadId: 'spawner-1',
      };
      await spawner.updateFromLoad(uut);
      assert(spawner.triggerUpperLimit !== uut.triggerUpperLimit);
    });

    it('does not update if the loadId does not match', async () => {
      const uut = {
        triggerUpperLimit: 15,
        version: 1,
        loadId: 'spawner-2',
      };
      await spawner.updateFromLoad(uut);
      assert(spawner.triggerUpperLimit !== uut.triggerUpperLimit);
    });

    it('updates the non-ref properties', async () => {
      const uut = {
        characterFactories: ['Foo', 'Bar'],
        triggerUpperLimit: 10,
        spawnsPerTrigger: 20,
        characterSelection: 'random',
        triggerType: 'tick',
        version: 1,
        loadId: 'spawner-1',
        factoryData: {
          key: 'value',
          otherKey: 'otherValue',
        },
      };
      await spawner.updateFromLoad(uut);
      assert(spawner.characterFactories.length === 2);
      assert(spawner.characterFactories[0] === 'Foo');
      assert(spawner.characterFactories[1] === 'Bar');
      assert(spawner.triggerUpperLimit === 10);
      assert(spawner.spawnsPerTrigger === 20);
      assert(spawner.characterSelection === 'random');
      assert(spawner.triggerType === 'tick');
      assert(spawner.factoryData['key'] === 'value');
      assert(spawner.factoryData['otherKey'] === 'otherValue');
    });

    it('is okay with optional properties', async () => {
      const uut = {
        version: 1,
        loadId: 'spawner-1',
      };
      const beforeCharacterFactories = [...spawner.characterFactories];
      const beforeTriggerUpperLimit = spawner.triggerUpperLimit;
      const beforeSpawnsPerTrigger = spawner.spawnsPerTrigger;
      const beforeCharacterSelection = spawner.characterSelection;
      const beforeTriggerType = spawner.triggerType;
      await spawner.updateFromLoad(uut);
      assert(beforeCharacterFactories.length === 1);
      assert(beforeCharacterFactories[0] === spawner.characterFactories[0]);
      assert(beforeTriggerUpperLimit === spawner.triggerUpperLimit);
      assert(beforeSpawnsPerTrigger === spawner.spawnsPerTrigger);
      assert(beforeCharacterSelection === spawner.characterSelection);
      assert(beforeTriggerType === spawner.triggerType);
    });
  });
});