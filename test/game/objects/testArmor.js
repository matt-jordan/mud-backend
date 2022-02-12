//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Armor from '../../../src/game/objects/Armor.js';
import ArmorModel from '../../../src/db/models/ArmorModel.js';

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

  describe('weight', () => {
    describe('when the item is not a container', () => {
      it('returns the current weight', async () => {
        const uut = new Armor(armorModel);
        await uut.load();
        assert(uut.weight === armorModel.weight);
      });
    });

    describe('when the item is a container', () => {
      beforeEach(async () => {
        const otherArmor = new ArmorModel();
        otherArmor.name = 'other armor';
        otherArmor.weight = 10;
        await otherArmor.save();

        armorModel.isContainer = true;
        armorModel.containerProperties.weightCapacity = 50;
        armorModel.containerProperties.weightReduction = 10;
        armorModel.inanimates.push({
          inanimateId: otherArmor._id,
          inanimateType: 'armor',
        });
        await armorModel.save();
      });

      it('returns the total weight', async () => {
        const uut = new Armor(armorModel);
        await uut.load();
        assert(uut.weight === 11);
      });
    });
  });

  describe('addItem', () => {
    let otherArmor;

    beforeEach(async () => {
      const otherArmorModel = new ArmorModel();
      otherArmorModel.name = 'other armor';
      otherArmorModel.weight = 10;
      await otherArmorModel.save();

      otherArmor = new Armor(otherArmorModel);
      await otherArmor.load();
    });

    describe('when the item is not a container', () => {
      it('returns false', async () => {
        const uut = new Armor(armorModel);
        await uut.load();

        const result = uut.addItem(otherArmor);
        assert(result === false);
      });
    });

    describe('when the item is a container', () => {
      beforeEach(async () => {
        armorModel.isContainer = true;
        await armorModel.save();
      });

      describe('when the weight capacity is exceeded', () => {
        beforeEach(async () => {
          armorModel.containerProperties.weightCapacity = 5;
          await armorModel.save();
        });

        it('returns false', async () => {
          const uut = new Armor(armorModel);
          await uut.load();

          const result = uut.addItem(otherArmor);
          assert(result === false);
        });
      });

      describe('when the weight capacity is not exceeded', () => {
        beforeEach(async () => {
          armorModel.containerProperties.weightCapacity = 50;
          armorModel.containerProperties.weightReduction = 50;
        });

        describe('when the item is the container itself', () => {
          it('returns false', async () => {
            const uut = new Armor(armorModel);
            await uut.load();

            const result = uut.addItem(uut);
            assert(result === false);
          });
        });

        describe('when the weight capacity is not exceeded', () => {
          it('puts the item in and returns true', async () => {
            const uut = new Armor(armorModel);
            await uut.load();

            const result = uut.addItem(otherArmor);
            assert(result);
            assert(uut.weight === 7);
          });
        });
      });
    });
  });

  describe('removeItem', () => {
    let otherArmor;

    beforeEach(async () => {
      const otherArmorModel = new ArmorModel();
      otherArmorModel.name = 'other armor';
      otherArmorModel.weight = 10;
      await otherArmorModel.save();

      otherArmor = new Armor(otherArmorModel);
      await otherArmor.load();
    });

    describe('when the item is not a container', () => {
      it('returns false', async () => {
        const uut = new Armor(armorModel);
        await uut.load();

        // Do something weird and just shove it in there to test the code path
        // we want to test
        uut.inanimates.addItem(otherArmor);

        const result = uut.removeItem(otherArmor);
        assert(result === false);
      });
    });

    describe('when the item is a container', () => {
      beforeEach(async () => {
        armorModel.isContainer = true;
        armorModel.containerProperties.weightCapacity = 100;
        armorModel.containerProperties.weightReduction = 25;
        await armorModel.save();
      });

      describe('when the item is not in the container', () => {
        it('returns false', async () => {
          const uut = new Armor(armorModel);
          await uut.load();

          const result = uut.removeItem(otherArmor);
          assert(result === false);
        });
      });

      describe('when the item is in the container', () => {
        it('removes the item and adjusts the weight correctly', async () => {
          const uut = new Armor(armorModel);
          await uut.load();
          assert(uut.addItem(otherArmor) === true);
          assert(uut.weight === 9.5);
          assert(uut.removeItem(otherArmor) === true);
          assert(uut.weight === 2);
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
      assert(uut.inanimates.length === 1);
      assert(uut.inanimates.all[0].name === 'other armor');
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
      uut.inanimates.all.length = 0;
      await uut.save();

      const updatedModel = await ArmorModel.findById(uut.id);
      assert(updatedModel);
      assert(updatedModel.durability.current === 1);
      assert(updatedModel.durability.base === 9);
      assert(updatedModel.inanimates.length === 0);
    });
  });
});
