//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import RandomWanderer from '../../../../src/game/characters/ai/RandomWanderer.js';
import HumanNpcFactory from '../../../../src/game/characters/factories/HumanNpcFactory.js';
import { createWorld, destroyWorld } from '../../fixtures.js';

describe('RandomWanderer', () => {
  let npc;

  beforeEach(async () => {
    const results = await createWorld();
    const world = results.world;
    const room = world.areas[0].rooms[0];
    const factory = new HumanNpcFactory(world, room);
    npc = await factory.generate();
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('onTick', () => {
    let ai;

    beforeEach(() => {
      ai = new RandomWanderer(npc);
      ai.moveChance = 0;
      npc.ai.push(ai);
    });

    describe('when the ai should move the character to a new room', () => {
      it('does so', async () => {
        await npc.onTick();
        assert(npc.room);
        assert(npc.room !== npc.world.areas[0].rooms[0]);
      });
    });
  });

});