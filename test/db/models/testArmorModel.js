//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import ArmorModel from '../../../build/db/models/ArmorModel.js';

describe('ArmorModel', () => {
  afterEach(() => {
    ArmorModel.deleteMany();
  });

  describe('creating', () => {
    it('rejects when there is no name', async () => {
      const uut = new ArmorModel();
      uut.description = 'A long description';
      uut.armorClass = 1;
      uut.dexterityPenalty = 1;
      uut.wearableLocations.push('head');
      uut.wearableLocations.push('body');
      uut.isShield = true;
      uut.classRestriction.push('fighter');
      uut.levelRestriction = 2;
      uut.weight = 10;
      await assert.rejects(uut.save());
    });

    it('creates the armor when it is not a container', async () => {
      const uut = new ArmorModel();
      uut.name = 'armor';
      uut.description = 'A long description';
      uut.armorClass = 1;
      uut.dexterityPenalty = 1;
      uut.wearableLocations.push('head');
      uut.wearableLocations.push('body');
      uut.isShield = true;
      uut.classRestriction.push('fighter');
      uut.levelRestriction = 2;
      uut.weight = 10;
      await uut.save();
      assert(uut);
    });

    it('creates the armor when it is a container', async () => {
      const uut = new ArmorModel();
      uut.name = 'armor';
      uut.description = 'A long description';
      uut.armorClass = 1;
      uut.dexterityPenalty = 1;
      uut.wearableLocations.push('head');
      uut.wearableLocations.push('body');
      uut.isShield = false;
      uut.isContainer = true;
      uut.containerProperties.weightReduction = 10;
      uut.containerProperties.weightCapacity = 100;
      uut.classRestriction.push('fighter');
      uut.levelRestriction = 2;
      uut.weight = 10;
      await uut.save();
      assert(uut);
    });
  });

});