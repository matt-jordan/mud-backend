//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import ArmorModel from '../../../../build/db/models/ArmorModel.js';
import Armor from '../../../../build/game/objects/Armor.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import backpackFactory from '../../../../build/game/objects/factories/backpack.js';
import maceFactory from '../../../../build/game/objects/factories/mace.js';
import { PutItemFactory, PutItemAction } from '../../../../build/game/commands/default/PutItem.js';


describe('PutItemAction', () => {
  let pc;
  let backpack;

  beforeEach(async () => {
    const results = await createWorld();
    pc = results.pc1;
    pc.transport = new FakeClient();

    backpack = await backpackFactory();
    pc.addHauledItem(backpack);
    const mace = await maceFactory();
    pc.addHauledItem(mace);
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('currency', () => {
    describe('when the character does not have the currency', () => {
      it('complains', async () => {
        const uut = new PutItemAction('gold', 'inventory', { quantity: 50 });
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You do not have 50 gold/);
      });
    });

    describe('when the character does not have any currency left', () => {
      it('complains', async () => {
        pc.currencies.deposit('gold', 1);
        pc.currencies.withdraw('gold', 1);
        const uut = new PutItemAction('gold', 'inventory', { quantity: 50 });
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You do not have 50 gold/);
      });
    });

    describe('when the destination is not available', () => {
      it('complains', async () => {
        pc.currencies.deposit('gold', 50);
        const uut = new PutItemAction('gold', 'bag', { quantity: 50 });
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You are not carrying bag/);
      });
    });

    describe('when the destination is the inventory', () => {
      it('recognizes the keyword correctly', async () => {
        pc.currencies.deposit('gold', 50);
        const uut = new PutItemAction('gold', 'inventory', { quantity: 10 });
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You put 10 gold coins in your inventory/);
        const gold = pc.inanimates.findItem('gold');
        assert(gold.name === 'gold (10)');
        assert(gold.isCurrency);
        assert(pc.currencies.balance('gold') === 40);
      });
    });

    describe('when the destination is in the inventory', () => {
      it('puts the gold where it belongs', async () => {
        pc.currencies.deposit('gold', 50);
        const uut = new PutItemAction('gold', 'backpack', { quantity: 10 });
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You put 10 gold coins in backpack/);
        const gold = backpack.inanimates.findItem('gold');
        assert(gold.name === 'gold (10)');
        assert(gold.isCurrency);
        assert(pc.currencies.balance('gold') === 40);
      });
    });
  });

  describe('when the source is not in the inventory', () => {
    it('complains', async () => {
      const uut = new PutItemAction('ring', 'backpack');
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /You are not carrying ring/);
    });
  });

  describe('when the destination is not available', () => {
    it('complains', async () => {
      const uut = new PutItemAction('mace', 'bag');
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /You are not carrying bag/);
    });
  });

  describe('when the destination is in the inventory', () => {
    it('puts the item into the destination', async () => {
      const uut = new PutItemAction('mace', 'backpack');
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /You put mace in backpack/);
    });
  });

  describe('when the destination is worn', () => {
    ['head', 'body', 'neck', 'hands', 'legs', 'feet', 'leftFinger', 'rightFinger', 'leftHand', 'rightHand', 'back'].forEach((location) => {
      describe(`on ${location}`, () => {
        beforeEach(async () => {
          const model = new ArmorModel();
          model.name = 'container';
          model.description = 'A test container';
          model.weight = 1;
          model.dexterityPenalty = 0;
          model.armorClass = 0;
          model.wearableLocations.push(location);
          model.isContainer = true;
          model.containerProperties.weightCapacity = 40;
          model.durability.current = 10;
          model.durability.base = 10;
          await model.save();

          const armor = new Armor(model);
          await armor.load();

          pc.physicalLocations[location].item = armor;
          pc.currencies.deposit('gold', 50);
        });

        [{quantity: 50, name: 'gold' }, {quantity: '', name: 'mace' }].forEach((item) => {
          describe(`${item.name}`, () => {

            it('complains if you aren not wearing anything there', async () => {
              const badLocation = location !== 'back' ? 'back' : 'body';
              const uut = new PutItemAction(item.name, 'container', { quantity: item.quantity, location: badLocation });
              await uut.execute(pc);
              assert(pc.transport.sentMessages.length === 1);
              assert.match(pc.transport.sentMessages[0], /You are not wearing anything on/);
            });

            describe('wrong named container', () => {
              beforeEach(async () => {
                const badLocation = location !== 'back' ? 'back' : 'body';
                const model = new ArmorModel();
                model.name = 'watcontainer';
                model.description = 'A test container';
                model.weight = 1;
                model.dexterityPenalty = 0;
                model.armorClass = 0;
                model.wearableLocations.push(badLocation);
                model.isContainer = true;
                model.containerProperties.weightCapacity = 40;
                model.durability.current = 10;
                model.durability.base = 10;
                await model.save();

                const armor = new Armor(model);
                await armor.load();

                pc.physicalLocations[badLocation].item = armor;
              });

              it('complains if the location is wrong', async () => {
                const badLocation = location !== 'back' ? 'back' : 'body';
                const uut = new PutItemAction(item.name, 'container', { quantity: item.quantity, location: badLocation });
                await uut.execute(pc);
                assert(pc.transport.sentMessages.length === 1);
                assert.match(pc.transport.sentMessages[0], /You are not wearing container on your/);
              });
            });

            it(`puts the ${item.name} into the destination`, async () => {
              const uut = new PutItemAction(item.name, 'container', { quantity: item.quantity, location });
              await uut.execute(pc);
              assert(pc.transport.sentMessages.length === 1);
              assert(pc.transport.sentMessages[0].includes(`${item.name}`));
            });
          });
        });
      });
    });
  });
});

describe('PutItemFactory', () => {
  describe('when generating an action', () => {
    it('handles an empty list', () => {
      const uut = new PutItemFactory();
      const result = uut.generate([]);
      assert(result);
      assert(result.message);
    });

    describe('when currency is specified', () => {
      describe('when the destination is not specified', () => {
        it('complains', () => {
          const uut = new PutItemFactory();
          const result = uut.generate(['50', 'gold']);
          assert(result);
          assert(result.message === 'What do you want to put 50 gold in?');
        });

        it('complains more', () => {
          const uut = new PutItemFactory(['50', 'gold', 'in']);
          const result = uut.generate(['50', 'gold']);
          assert(result);
          assert(result.message === 'What do you want to put 50 gold in?');
        });
      });

      describe('when an invalid amount is specified', () => {
        it('handles negatives', () => {
          const uut = new PutItemFactory();
          const result = uut.generate(['-1', 'gold', 'in', 'inventory']);
          assert(result);
          assert(result.message === '-1 is not a valid amount.');
        });

        it('handles zero', () => {
          const uut = new PutItemFactory();
          const result = uut.generate(['0', 'gold', 'in', 'inventory']);
          assert(result);
          assert(result.message === '0 is not a valid amount.');
        });
      });

      describe('when no specific location is specified', () => {
        it('sets it up correctly', () => {
          const uut = new PutItemFactory();
          const result = uut.generate(['50', 'gold', 'in', 'inventory']);
          assert(result);
          assert(result.source === 'gold');
          assert(result.quantity === 50);
          assert(result.destination === 'inventory');
        });
      });

      describe('when the location is specified', () => {
        it('but incorrectly it complains', () => {
          const uut = new PutItemFactory();
          const result = uut.generate(['50', 'gold', 'in', 'backpack', 'on']);
          assert(result);
          assert(result.message === 'What backpack do you want to put 50 gold in?');
        });

        it('correctly it set it up', () => {
          const uut = new PutItemFactory();
          const result = uut.generate(['50', 'gold', 'in', 'backpack', 'on', 'back']);
          assert(result);
          assert(result.source === 'gold');
          assert(result.quantity === 50);
          assert(result.destination === 'backpack');
          assert(result.location === 'back');
        });
      });
    });

    describe('when the source is not specified', () => {
      it('complains', () => {
        const uut = new PutItemFactory();
        const result = uut.generate(['in', 'backpack']);
        assert(result);
        assert(result.message === 'What do you want to put in backpack?');
      });
    });

    describe('when the target is not specified', () => {
      it('complains', () => {
        const uut = new PutItemFactory();
        const result = uut.generate(['longsword']);
        assert(result);
        assert(result.message === 'What do you want to put longsword in?');
      });

      it('still complains', () => {
        const uut = new PutItemFactory();
        const result = uut.generate(['longsword', 'in']);
        assert(result);
        assert(result.message === 'What do you want to put longsword in?');
      });
    });

    describe('when the location is specified', () => {
      it('but incorrectly it complains', () => {
        const uut = new PutItemFactory();
        const result = uut.generate(['longsword', 'in', 'backpack', 'on']);
        assert(result);
        assert(result.message === 'What backpack do you want to put longsword in?');
      });

      it('correctly it set it up', () => {
        const uut = new PutItemFactory();
        const result = uut.generate(['longsword', 'in', 'backpack', 'on', 'back']);
        assert(result);
        assert(result.source === 'longsword');
        assert(result.destination === 'backpack');
        assert(result.location === 'back');
      });
    });

    it('handles simple item sources and destinations', () => {
      const uut = new PutItemFactory();
      const result = uut.generate(['longsword', 'in', 'backpack']);
      assert(result);
      assert(result.source === 'longsword');
      assert(result.destination === 'backpack');
    });

    it('handles complex item sources and destinations', () => {
      const uut = new PutItemFactory();
      const result = uut.generate(['sharp', 'longsword', 'in', 'large', 'backpack']);
      assert(result);
      assert(result.source === 'sharp longsword');
      assert(result.destination === 'large backpack');
    });
  });
});