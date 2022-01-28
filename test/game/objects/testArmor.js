//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { Armor } from '../../../src/game/objects/armor.js';
import ArmorModel from '../../../src/db/models/Armor.js';

describe('Armor', () => {
  afterEach(async () => {
    await ArmorModel.deleteMany();
  });

  let armorModel;
  beforeEach(async () => {
    armorModel = new ArmorModel();
    armorModel.name = 'Test Armor';
    armorModel.description = 'Some test armor';
    armorModel.armorClass = 1;
    armorModel.dexterityPenalty = 2;
    armorModel.weight = 2;
    armorModel.durability.current = 15;
    armorModel.durability.base = 20;
    await armorModel.save();
  });

  describe('id', () => {
    it('returns the expected ID', async () => {
      const uut = new Armor(armorModel);
      await uut.load();
      assert(uut.id === armorModel._id.toString());
    });
  });

  describe('name', () => {
    it('returns the expected name', async () => {
      const uut = new Armor(armorModel);
      await uut.load();
      assert(uut.name === armorModel.name);
    });
  });

  describe('wearableLocation', () => {
    describe('single location', () => {
      beforeEach(async () => {
        armorModel.wearableLocations.push('head');
        await armorModel.save();
      });

      it('returns one wearable location when there is only one', async () => {
        const uut = new Armor(armorModel);
        await uut.load();
        assert(uut.wearableLocations.length === 1);
        assert(uut.wearableLocations[0] === 'head');
      });
    });

    describe('multiple locations', () => {
      beforeEach(async () => {
        armorModel.wearableLocations.push('hands');
        armorModel.wearableLocations.push('feet');
        await armorModel.save();
      });

      it('returns multiple wearable locations when there are multiple', async () => {
        const uut = new Armor(armorModel);
        await uut.load();
        assert(uut.wearableLocations.length === 2);
        assert(uut.wearableLocations[0] === 'hands');
        assert(uut.wearableLocations[1] === 'feet');
      });
    });
  });

  describe('toShortText', () => {
    it('returns expected short text', async () => {
      const uut = new Armor(armorModel);
      await uut.load();
      assert(uut.toShortText() === uut.name);
    });
  });

  describe('checkCanPlayerUse', () => {
    let pc;

    beforeEach(() => {
      pc = {
        physicalLocations: {
          head: {
            item: null,
          },
          body: {
            item: null,
          },
          neck: {
            item: null,
          },
          legs: {
            item: null,
          }
        }
      };
    });

    describe('when the PC does not have a location free', () => {
      describe('for one location', () => {
        beforeEach(async () => {
          pc.physicalLocations.legs.item = 'taken';
          armorModel.wearableLocations.push('legs');
          await armorModel.save();
        });

        it('returns false', async () => {
          const uut = new Armor(armorModel);
          await uut.load();
          const result = uut.checkCanPlayerUse(pc);
          assert(result.result === false);
          assert(result.reason);
        });
      });

      describe('for multiple locations', () => {
        beforeEach(async () => {
          pc.physicalLocations.legs.item = 'taken';
          pc.physicalLocations.head.item = 'taken';
          armorModel.wearableLocations.push('head');
          armorModel.wearableLocations.push('legs');
          await armorModel.save();
        });

        it('returns false', async () => {
          const uut = new Armor(armorModel);
          await uut.load();
          const result = uut.checkCanPlayerUse(pc);
          assert(result.result === false);
          assert(result.reason);
        });
      });
    });

    describe('when the PC has a location free', () => {
      describe('for one location', () => {
        beforeEach(async () => {
          pc.physicalLocations.legs.item = 'taken';
          armorModel.wearableLocations.push('head');
          await armorModel.save();
        });

        it('returns true', async () => {
          const uut = new Armor(armorModel);
          await uut.load();
          const result = uut.checkCanPlayerUse(pc);
          assert(result);
        });
      });

      describe('for multiple locations', () => {
        beforeEach(async () => {
          pc.physicalLocations.head.item = 'taken';
          armorModel.wearableLocations.push('head');
          armorModel.wearableLocations.push('legs');
          await armorModel.save();
        });

        it('returns true', async () => {
          const uut = new Armor(armorModel);
          await uut.load();
          const result = uut.checkCanPlayerUse(pc);
          assert(result);
        });
      });
    });
  });

  describe('load', () => {
    beforeEach(async () => {
      const otherArmor = new ArmorModel();
      otherArmor.name = 'other armor';
      await otherArmor.save();

      armorModel.isContainer = true;
      armorModel.inanimates.push({
        inanimateId: otherArmor._id,
        inanimateType: 'armor',
      });
      await armorModel.save();
    });

    it('loads all the attributes we expect', async () => {
      const uut = new Armor(armorModel);
      await uut.load();
      assert(uut.name === armorModel.name);
      assert(uut.durability.current === 15);
      assert(uut.durability.base === 20);
      assert(uut.items.length === 1);
      assert(uut.items[0].name === 'other armor');
    });
  });

  describe('save', () => {
    beforeEach(async () => {
      const otherArmor = new ArmorModel();
      otherArmor.name = 'other armor';
      await otherArmor.save();

      armorModel.isContainer = true;
      armorModel.inanimates.push({
        inanimateId: otherArmor._id,
        inanimateType: 'armor',
      });
      await armorModel.save();
    });

    it('saves the mutable properties', async () => {
      const uut = new Armor(armorModel);
      await uut.load();
      uut.durability.current = 1;
      uut.durability.base = 9;
      assert(uut.model.isContainer);
      uut.items.length = 0;
      await uut.save();

      const updatedModel = await ArmorModel.findById(uut.id);
      assert(updatedModel);
      assert(updatedModel.durability.current === 1);
      assert(updatedModel.durability.base === 9);
      assert(updatedModel.inanimates.length === 0);
    });
  });
});
