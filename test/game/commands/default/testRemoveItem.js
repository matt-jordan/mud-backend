//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { RemoveItemAction, RemoveItemFactory } from '../../../../src/game/commands/default/RemoveItem.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import ringFactory from '../../../../src/game/objects/factories/ring.js';
import shirtFactory from '../../../../src/game/objects/factories/shirt.js';

describe('RemoveItemAction', () => {
  let pc;

  beforeEach(async () => {
    const results = await createWorld();
    pc = results.pc1;
    pc.transport = new FakeClient();
    const ring1 = await ringFactory();
    const ring2 = await ringFactory();
    const shirt = await shirtFactory();
    pc.physicalLocations.leftFinger.item = ring1;
    pc.physicalLocations.rightFinger.item = ring2;
    pc.physicalLocations.body.item = shirt;
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('when the player is not wearing the item', () => {
    describe('anywhere', () => {
      it('tells them that they are not wearing it', async () => {
        const uut = new RemoveItemAction('Backpack');
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You are not wearing Backpack/);
        assert(pc.inanimates.length === 0);
      });
    });

    describe('in the location specified', async () => {
      it('tells them that they are not wearing it', async () => {
        const uut = new RemoveItemAction('ring', 'body');
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You are not wearing ring on your body/);
        assert(pc.inanimates.length === 0);
      });
    });
  });

  describe('when the item is ambiguous', () => {
    it('tells the player to be more specific', async () => {
      const uut = new RemoveItemAction('ring');
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /Which ring/);
      assert(pc.inanimates.length === 0);
    });
  });

  describe('when the player is specific', () => {
    it('removes the correct item and puts it in the player inventory', async () => {
      const uut = new RemoveItemAction('ring', 'left finger');
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /You stop wearing ring on your left finger/);
      assert(pc.inanimates.length === 1);
      assert(pc.inanimates.all[0].name === 'ring');
    });
  });
});

describe('RemoveItemFactory', () => {
  describe('when no item is specified', () => {
    it('rejects the action', () => {
      const factory = new RemoveItemFactory();
      const result = factory.generate([]);
      assert(result);
      assert(result.message);
    });
  });

  describe('when the item is specified', () => {
    it('generates the action with the expected target', () => {
      const factory = new RemoveItemFactory();
      const result = factory.generate(['thing']);
      assert(result);
      assert(result.target === 'thing');
    });

    it('handles articles and misc words', () => {
      const factory = new RemoveItemFactory();
      const result = factory.generate(['the', 'thing']);
      assert(result);
      assert(result.target === 'the thing');
    });
  });

  describe('when the item and a location is specified', () => {
    it('generates the action with the expected target', () => {
      const factory = new RemoveItemFactory();
      const result = factory.generate(['thing', 'from', 'head']);
      assert(result);
      assert(result.target === 'thing');
      assert(result.location === 'head');
    });

    it('handles articles and misc words', () => {
      const factory = new RemoveItemFactory();
      const result = factory.generate(['the', 'thing', 'from', 'left', 'finger']);
      assert(result);
      assert(result.target === 'the thing');
      assert(result.location === 'left finger');
    });
  });
});
