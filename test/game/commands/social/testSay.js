//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import { SayFactory, SayAction } from '../../../../build/game/commands/social/Say.js';

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

  describe('when saying something', () => {
    it('says things in the room and to the player', async () => {
      const uut = new SayAction(['hello', 'world']);
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /hello world/);
    });
  });
});

describe('SayFactory', () => {

  describe('when nothing is provided', () => {
    it('rejects with an error', () => {
      const uut = new SayFactory();
      const result = uut.generate();
      assert(result);
      assert.match(result.message, /What do you want to say/);
    });

    it('also rejects with an error', () => {
      const uut = new SayFactory();
      const result = uut.generate([]);
      assert(result);
      assert.match(result.message, /What do you want to say/);
    });
  });

  describe('when tokens are provided', () => {
    it('sets the payload', () => {
      const uut = new SayFactory();
      const result = uut.generate(['hello', 'there']);
      assert(result.message[0], 'hello');
      assert(result.message[1], 'there');
    });
  });
});
