//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import { ShoutAction, ShoutFactory } from '../../../../src/game/commands/social/Shout.js';

describe('SayAction', () => {
  let pc;

  beforeEach(async () => {
    const results = await createWorld();
    pc = results.pc1;
    pc.transport = new FakeClient();
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('when shouting something', () => {
    it('says things in the room and to the player', async () => {
      const uut = new ShoutAction(['hello', 'world']);
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /hello world/);
    });
  });
});

describe('ShoutFactory', () => {

  describe('when nothing is provided', () => {
    it('rejects with an error', () => {
      const uut = new ShoutFactory();
      const result = uut.generate();
      assert(result);
      assert.match(result.message, /What do you want to shout/);
    });

    it('also rejects with an error', () => {
      const uut = new ShoutFactory();
      const result = uut.generate([]);
      assert(result);
      assert.match(result.message, /What do you want to shout/);
    });
  });

  describe('when tokens are provided', () => {
    it('sets the payload', () => {
      const uut = new ShoutFactory();
      const result = uut.generate(['hello', 'there']);
      assert(result.message[0], 'hello');
      assert(result.message[1], 'there');
    });
  });
});
