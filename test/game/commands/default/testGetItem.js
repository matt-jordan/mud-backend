//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { GetItemAction, GetItemFactory } from '../../../../src/game/commands/default/GetItem.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import backpackFactory from '../../../../src/game/objects/factories/backpack.js';
import longswordFactory from '../../../../src/game/objects/factories/longsword.js';
import currencyFactory from '../../../../src/game/objects/factories/currency.js';

describe('GetItemAction', () => {

  let pc;

  beforeEach(async () => {
    const results = await createWorld();
    pc = results.pc1;
    pc.transport = new FakeClient();
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('when the item does not exist', () => {
    it('tells the player that the item does not exist', async () => {
      const uut = new GetItemAction('longsword');
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /longsword is not in/);
    });
  });

  describe('when the container does not exist', () => {
    beforeEach(async () => {
      const weapon = await longswordFactory();
      pc.room.addItem(weapon);
    });

    it('tells the player that the container does not exist', async () => {
      const uut = new GetItemAction('longsword', 'backpack');
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /backpack does not exist/);
    });
  });

  describe('when the keyword "all" is used', () => {
    describe('when its in a room', () => {
      beforeEach(async () => {
        const weapon1 = await longswordFactory();
        const weapon2 = await longswordFactory();
        pc.room.addItem(weapon1);
        pc.room.addItem(weapon2);
      });

      describe('and the room is well lit', () => {
        it('the player picks everything up', async () => {
          const uut = new GetItemAction('all');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 2);
          assert.match(pc.transport.sentMessages[0], /You put longsword in your inventory/);
          assert.match(pc.transport.sentMessages[1], /You put longsword in your inventory/);
          assert(pc.inanimates.length === 2);
        });
      });

      describe('and it is too dark to see', () => {
        beforeEach(() => {
          pc.room.model.attributes.push({ attributeType: 'dark' });
        });

        it('the player is told they cannot find anything', async () => {
          const uut = new GetItemAction('all');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 1);
          assert.match(pc.transport.sentMessages[0], /There is nothing here for you to get/);
          assert(pc.room.inanimates.length === 2);
        });
      });
    });

    describe('when a container is specified', () => {
      let backpack;

      beforeEach(async () => {
        const weapon1 = await longswordFactory();
        const weapon2 = await longswordFactory();
        backpack = await backpackFactory();
        backpack.addItem(weapon1);
        backpack.addItem(weapon2);
      });

      describe('when the container is in the room', () => {
        beforeEach(() => {
          pc.room.addItem(backpack);
        });

        it('the player picks everything up', async () => {
          const uut = new GetItemAction('all', 'Backpack');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 2);
          assert.match(pc.transport.sentMessages[0], /You put longsword in your inventory/);
          assert.match(pc.transport.sentMessages[1], /You put longsword in your inventory/);
          assert(pc.inanimates.length === 2);
        });
      });

      describe('when the container is on their person', () => {
        beforeEach(() => {
          pc.physicalLocations.back.item = backpack;
        });

        it('the player picks everything up', async () => {
          const uut = new GetItemAction('all', 'Backpack');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 2);
          assert.match(pc.transport.sentMessages[0], /You put longsword in your inventory/);
          assert.match(pc.transport.sentMessages[1], /You put longsword in your inventory/);
          assert(pc.inanimates.length === 2);
        });
      });

      describe('when the container is in their inventory', () => {
        beforeEach(() => {
          pc.addHauledItem(backpack);
        });

        it('the player picks everything up', async () => {
          const uut = new GetItemAction('all', 'Backpack');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 2);
          assert.match(pc.transport.sentMessages[0], /You put longsword in your inventory/);
          assert.match(pc.transport.sentMessages[1], /You put longsword in your inventory/);
          assert(pc.inanimates.length === 3);
        });
      });
    });
  });

  describe('when a single item is specified', () => {
    describe('currency', () => {
      describe('when its in a room', () => {
        beforeEach(async () => {
          const gold = await currencyFactory({ name: 'gold', quantity: 50 });
          pc.room.addItem(gold);
        });

        describe('and it is too dark to see', () => {
          beforeEach(() => {
            pc.room.model.attributes.push({ attributeType: 'dark' });
          });

          it('the player is told they cannot find anything', async () => {
            const uut = new GetItemAction('all');
            await uut.execute(pc);
            assert(pc.transport.sentMessages.length === 1);
            assert.match(pc.transport.sentMessages[0], /There is nothing here for you to get/);
            assert(pc.currencies.balance('gold') === 0);
          });
        });

        it('the player picks it up when they specify the whole pile', async () => {
          const uut = new GetItemAction('gold (50)');
          await uut.execute(pc);
          assert(pc.transport.sentMessages[0], /You pick up 50 gold coins/);
          assert(pc.inanimates.length === 0);
          assert(pc.currencies.balance('gold') === 50);
        });

        it('the player picks it up when they specify just some of it', async () => {
          const uut = new GetItemAction('gold');
          await uut.execute(pc);
          assert(pc.transport.sentMessages[0], /You pick up 50 gold coins/);
          assert(pc.inanimates.length === 0);
          assert(pc.currencies.balance('gold') === 50);
        });
      });

      describe('when a container is specified', () => {
        let backpack;

        beforeEach(async () => {
          const gold = await currencyFactory({ name: 'gold', quantity: 50 });
          backpack = await backpackFactory();
          backpack.addItem(gold);
        });

        describe('when the container is in the room', () => {
          beforeEach(() => {
            pc.room.addItem(backpack);
          });

          it('the player picks it up when they specify the whole pile', async () => {
            const uut = new GetItemAction('gold (50)', 'backpack');
            await uut.execute(pc);
            assert(pc.transport.sentMessages[0], /You take 50 gold coins from backpack/);
            assert(pc.inanimates.length === 0);
            assert(pc.currencies.balance('gold') === 50);
          });

          it('the player picks it up when they specify just some of it', async () => {
            const uut = new GetItemAction('gold', 'backpack');
            await uut.execute(pc);
            assert(pc.transport.sentMessages[0], /You take 50 gold coins from backpack/);
            assert(pc.inanimates.length === 0);
            assert(pc.currencies.balance('gold') === 50);
          });
        });

        describe('when the container is on their person', () => {
          beforeEach(() => {
            pc.addHauledItem(backpack);
          });

          it('the player picks it up when they specify the whole pile', async () => {
            const uut = new GetItemAction('gold (50)', 'backpack');
            await uut.execute(pc);
            assert(pc.transport.sentMessages[0], /You take 50 gold coins from backpack/);
            assert(pc.inanimates.length === 1);
            assert(pc.currencies.balance('gold') === 50);
          });

          it('the player picks it up when they specify just some of it', async () => {
            const uut = new GetItemAction('gold', 'backpack');
            await uut.execute(pc);
            assert(pc.transport.sentMessages[0], /You take 50 gold coins from backpack/);
            assert(pc.inanimates.length === 1);
            assert(pc.currencies.balance('gold') === 50);
          });
        });
      });
    });

    describe('when its in a room', () => {
      beforeEach(async () => {
        const weapon1 = await longswordFactory();
        pc.room.addItem(weapon1);
      });

      describe('and it is too dark to see', () => {
        beforeEach(() => {
          pc.room.model.attributes.push({ attributeType: 'dark' });
        });

        it('the player is told they cannot find anything', async () => {
          const uut = new GetItemAction('all');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 1);
          assert.match(pc.transport.sentMessages[0], /There is nothing here for you to get/);
          assert(pc.room.inanimates.length === 1);
        });
      });

      it('the player picks it up', async () => {
        const uut = new GetItemAction('longsword');
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You put longsword in your inventory/);
        assert(pc.inanimates.length === 1);
      });
    });

    describe('when a container is specified', () => {
      let backpack;

      beforeEach(async () => {
        const weapon1 = await longswordFactory();
        backpack = await backpackFactory();
        backpack.addItem(weapon1);
      });

      describe('when the container is in the room', () => {
        beforeEach(() => {
          pc.room.addItem(backpack);
        });

        it('the player picks it up', async () => {
          const uut = new GetItemAction('longsword', 'Backpack');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 1);
          assert.match(pc.transport.sentMessages[0], /You put longsword in your inventory/);
          assert(pc.inanimates.length === 1);
        });
      });

      describe('when the container is on their person', () => {
        beforeEach(() => {
          pc.physicalLocations.back.item = backpack;
        });

        it('the player picks it up', async () => {
          const uut = new GetItemAction('longsword', 'Backpack');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 1);
          assert.match(pc.transport.sentMessages[0], /You put longsword in your inventory/);
          assert(pc.inanimates.length === 1);
        });
      });

      describe('when the container is in their inventory', () => {
        beforeEach(() => {
          pc.addHauledItem(backpack);
        });

        it('the player picks it up', async () => {
          const uut = new GetItemAction('longsword', 'Backpack');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 1);
          assert.match(pc.transport.sentMessages[0], /You put longsword in your inventory/);
          assert(pc.inanimates.length === 2);
        });
      });
    });
  });

});

describe('GetItemFactory', () => {
  describe('when no item is specified', () => {
    it('rejects the action', () => {
      const factory = new GetItemFactory();
      const result = factory.generate([]);
      assert(result);
      assert(result.message);
    });
  });

  describe('when the item is not in something', () => {
    it('generates the action with the expected target', () => {
      const factory = new GetItemFactory();
      const result = factory.generate(['thing']);
      assert(result);
      assert(result.target === 'thing');
    });

    it('handles articles and misc words', () => {
      const factory = new GetItemFactory();
      const result = factory.generate(['the', 'thing']);
      assert(result);
      assert(result.target === 'the thing');
    });
  });

  describe('when the item is in something', () => {
    it('generates the action with the exepcted targets', () => {
      const factory = new GetItemFactory();
      const result = factory.generate(['thing', 'from', 'backpack']);
      assert(result);
      assert(result.target === 'thing');
      assert(result.container === 'backpack');
    });

    it('handles articles and misc words', () => {
      const factory = new GetItemFactory();
      const result = factory.generate(['the', 'thing', 'from', 'the', 'backpack']);
      assert(result);
      assert(result.target === 'the thing');
      assert(result.container === 'the backpack');
    });
  });
});
