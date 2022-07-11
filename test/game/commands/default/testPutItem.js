//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import ArmorModel from '../../../../src/db/models/ArmorModel.js';
import Armor from '../../../../src/game/objects/Armor.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import backpackFactory from '../../../../src/game/objects/factories/backpack.js';
import maceFactory from '../../../../src/game/objects/factories/mace.js';
import { PutItemFactory, PutItemAction } from '../../../../src/game/commands/default/PutItem.js';


describe('PutItemAction', () => {
  let pc;

  beforeEach(async () => {
    const results = await createWorld();
    pc = results.pc1;
    pc.transport = new FakeClient();

    const backpack = await backpackFactory();
    pc.addHauledItem(backpack);
    const mace = await maceFactory();
    pc.addHauledItem(mace);
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('when the source is not in the inventory', () => {
    it('complains', () => {
      const uut = new PutItemAction('ring', 'backpack');
      uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /You are not carrying ring/);
    });
  });

  describe('when the destination is not available', () => {
    it('complains', () => {
      const uut = new PutItemAction('mace', 'bag');
      uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /You are not carrying bag/);
    });
  });

  describe('when the destination is in the inventory', () => {
    it('puts the item into the destination', () => {
      const uut = new PutItemAction('mace', 'backpack');
      uut.execute(pc);
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
        });

        it('complains if you aren not wearing anything there', () => {
          const badLocation = location !== 'back' ? 'back' : 'body';
          const uut = new PutItemAction('mace', 'container', badLocation);
          uut.execute(pc);
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

          it('complains if the location is wrong', () => {
            const badLocation = location !== 'back' ? 'back' : 'body';
            const uut = new PutItemAction('mace', 'container', badLocation);
            uut.execute(pc);
            assert(pc.transport.sentMessages.length === 1);
            assert.match(pc.transport.sentMessages[0], /You are not wearing container on your/);
          });
        });

        it('puts the item into the destination', () => {
          const uut = new PutItemAction('mace', 'container', location);
          uut.execute(pc);
          assert(pc.transport.sentMessages.length === 1);
          assert.match(pc.transport.sentMessages[0], /You put mace in container/);
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