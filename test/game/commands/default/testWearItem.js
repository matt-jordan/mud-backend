//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { WearItemAction, WearItemFactory } from '../../../../src/game/commands/default/WearItem.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import { ringFactory, shirtFactory } from '../../../../src/game/objects/armor.js';

describe('WearItemAction', () => {
  let pc;

  beforeEach(async () => {
    const results = await createWorld();
    pc = results.pc1;
    pc.transport = new FakeClient();
    const ring = await ringFactory();
    const shirt = await shirtFactory();
    pc.addHauledItem(ring);
    pc.addHauledItem(shirt);
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('when the player is not carrying the item', () => {
    it('tells them that they are not carrying it', async () => {
      const uut = new WearItemAction('Backpack');
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /You are not carrying Backpack/);
      assert(pc.inanimates.length === 2);
    });
  });

  describe('when the location is ambiguous', () => {
    describe('and the player has not given direction', () => {
      it('tells the player to be more specific', async () => {
        const uut = new WearItemAction('Ring');
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /Where would you like to wear Ring/);
        assert(pc.inanimates.length === 2);
      });
    });

    describe('and the player provides an invalid location', () => {
      it('tells the player that it is invalid', async () => {
        const uut = new WearItemAction('Ring', 'body');
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You cannot wear Ring on your body/);
        assert(pc.inanimates.length === 2);
      });
    });

    describe('and the player provides a valid location', () => {
      it('wears the item', async () => {
        const uut = new WearItemAction('Ring', 'left finger');
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You put Ring on your left finger/);
        assert(pc.inanimates.length === 1);
      });
    });
  });

  describe('when the location is not ambiguous', () => {
    describe('but the player is silly and specifies a location', () => {
      it('tells the player that they are not making sense', async () => {
        const uut = new WearItemAction('Shirt', 'left finger');
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You cannot wear Shirt on your left finger/);
        assert(pc.inanimates.length === 2);
      });
    });

    describe('because there is only one place to wear the item', () => {
      it('puts the correct item on the player', async () => {
        const uut = new WearItemAction('Shirt');
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You put Shirt on your body/);
        assert(pc.inanimates.length === 1);
        assert(pc.physicalLocations.body.item);
      });
    });

    describe('because the player has taken up the other location with another item', () => {
      beforeEach(async () => {
        const ring = await ringFactory();
        pc.physicalLocations.leftFinger.item = ring;
      });

      it('figures out the right place to put the item', async () => {
        const uut = new WearItemAction('Ring');
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You put Ring on your right finger/);
        assert(pc.inanimates.length === 1);
        assert(pc.physicalLocations.rightFinger.item);
      });
    });
  });
});

describe('WearItemFactory', () => {
  describe('when no item is specified', () => {
    it('rejects the action', () => {
      const factory = new WearItemFactory();
      const result = factory.generate();
      assert(result === null);
    });

    it('rejects the action', () => {
      const factory = new WearItemFactory();
      const result = factory.generate([]);
      assert(result === null);
    });
  });

  describe('when the item is specified', () => {
    it('generates the action with the expected target', () => {
      const factory = new WearItemFactory();
      const result = factory.generate(['thing']);
      assert(result);
      assert(result.target === 'thing');
    });

    it('handles articles and misc words', () => {
      const factory = new WearItemFactory();
      const result = factory.generate(['the', 'thing']);
      assert(result);
      assert(result.target === 'the thing');
    });
  });

  describe('when the item and a location is specified', () => {
    it('generates the action with the expected target', () => {
      const factory = new WearItemFactory();
      const result = factory.generate(['thing', 'on', 'head']);
      assert(result);
      assert(result.target === 'thing');
      assert(result.location === 'head');
    });

    it('handles articles and misc words', () => {
      const factory = new WearItemFactory();
      const result = factory.generate(['the', 'thing', 'on', 'left', 'finger']);
      assert(result);
      assert(result.target === 'the thing');
      assert(result.location === 'left finger');
    });
  });
});
