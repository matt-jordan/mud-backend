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
    describe('normal objects', () => {
      it('drops it on the floor of the room', async () => {
        const uut = new DropItemAction('longsword');
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You drop longsword/);
        assert(pc.inanimates.length === 0);
        assert(pc.room.inanimates.length === 1);
      });
    });

    describe('currency', () => {
      beforeEach(() => {
        pc.currencies.deposit('gold', 50);
      });

      describe('when the currency does not exist', () => {
        it('tells you it does not know what that is', async () => {
          const uut = new DropItemAction('wat', 50);
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 1);
          assert.match(pc.transport.sentMessages[0], /You do not have 50 wat/);
          assert(pc.room.inanimates.length === 0);
        });
      });

      describe('when the amount exists', () => {
        it('drops it on the floor of the room', async () => {
          const uut = new DropItemAction('gold', 10);
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 1);
          assert.match(pc.transport.sentMessages[0], /You drop gold \(10\)/);
          assert(pc.currencies.balance('gold') === 40);
          assert(pc.room.inanimates.length === 1);
        });
      });

      describe('when the amount exceeds the balance', () => {
        it('drops the balance on the floor of the room', async () => {
          const uut = new DropItemAction('gold', 100);
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 1);
          assert.match(pc.transport.sentMessages[0], /You drop gold \(50\)/);
          assert(pc.currencies.balance('gold') === 0);
          assert(pc.room.inanimates.length === 1);
        });
      });

      describe('when the player has no money', () => {
        it('tells the player they have no money', async () => {
          pc.currencies.withdraw('gold', 50);
          const uut = new DropItemAction('gold', 1);
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 1);
          assert.match(pc.transport.sentMessages[0], /You do not have 1 gold/);
          assert(pc.room.inanimates.length === 0);
        });
      });

      describe('when the amount is bogus', () => {
        it('tells the player to stop being weird', async () => {
          const uut = new DropItemAction('gold', 0);
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 1);
          assert.match(pc.transport.sentMessages[0], /You do not have 0 gold/);
          assert(pc.room.inanimates.length === 0);
        });
      });
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

    it('handles money', () => {
      const factory = new DropItemFactory();
      const result = factory.generate(['50', 'gold']);
      assert(result);
      assert(result.target === 'gold', result.target);
      assert(result.quantity === 50);
    });

    it('handles weirdly named money', () => {
      const factory = new DropItemFactory();
      const result = factory.generate(['50', 'gold things']);
      assert(result);
      assert(result.target === 'gold things');
      assert(result.quantity === 50);
    });

    it('rejects when it is just a number', () => {
      const factory = new DropItemFactory();
      const result = factory.generate(['1']);
      assert(!result.target);
      assert(result.message);
    });

    it('rejects when the number is 0', () => {
      const factory = new DropItemFactory();
      const result = factory.generate(['0', 'gold']);
      assert(result);
      assert(!result.target);
      assert(result.message);
    });

    it('rejects when the number is less than 0', () => {
      const factory = new DropItemFactory();
      const result = factory.generate(['-1', 'gold']);
      assert(result);
      assert(!result.target);
      assert(result.message);
    });
  });
});
