//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import RatFactory from '../../../../src/game/characters/factories/RatFactory.js';
import { createWorld, destroyWorld } from '../../fixtures.js';

describe('RatFactory', () => {
  let world;

  beforeEach(async () => {
    const results = await createWorld();
    world = results.world;

  });

  afterEach(async () => {
    await destroyWorld();
  });

  it('creates a rat in the world', async () => {
    const room = world.areas[0].rooms[0];
    const uut = new RatFactory(world, room);
    assert(uut);
    const rat = await uut.generate();
    assert(rat);
    assert(rat.attacks.length === 1);
    assert(rat.attacks[0].minDamage === 0);
    assert(rat.attacks[0].maxDamage === 1);
    assert(rat.attacks[0].damageType === 'piercing');
    assert(rat.attacks[0].verbs.firstPerson === 'bite');
    assert(rat.attacks[0].verbs.thirdPerson === 'bites');
    assert(rat.room.id === room.id);
    assert(room.characters.all.find((c) => c.id === rat.id));
  });
});
