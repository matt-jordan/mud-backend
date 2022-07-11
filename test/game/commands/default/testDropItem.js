//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { DropItemAction, DropItemFactory } from '../../../../src/game/commands/default/DropItem.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import longswordFactory from '../../../../src/game/objects/factories/longsword.js';

describe('DropItemAction', () => {
  let pc;

  beforeEach(async () => {
    const results = await createWorld();
    pc = results.pc1;
    pc.transport = new FakeClient();
    const weapon = await longswordFactory();
    pc.addHauledItem(weapon);
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('when the item is not in the player inventory', () => {
    it('tells them it does not exist', async () => {
      const uut = new DropItemAction('backpack');
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /You do not have backpack/);
      assert(pc.inanimates.length === 1);
      assert(pc.room.inanimates.length === 0);
    });
  });

  describe('when the item is in the player inventory', () => {
    it('drops it on the floor of the room', async () => {
      const uut = new DropItemAction('longsword');
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /You drop longsword/);
      assert(pc.inanimates.length === 0);
      assert(pc.room.inanimates.length === 1);
    });
  });
});

describe('DropItemFactory', () => {
  describe('when no item is specified', () => {
    it('returns an error action', () => {
      const factory = new DropItemFactory();
      const result = factory.generate();
      assert(result);
      assert(result.message);
    });
  });

  describe('when the item is specified', () => {
    it('generates the action with the expected target', () => {
      const factory = new DropItemFactory();
      const result = factory.generate(['thing']);
      assert(result);
      assert(result.target === 'thing');
    });

    it('handles articles and misc words', () => {
      const factory = new DropItemFactory();
      const result = factory.generate(['the', 'thing']);
      assert(result);
      assert(result.target === 'the thing');
    });
  });
});
