//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import WeaponModel from '../../../build/db/models/WeaponModel.js';

describe('WeaponModel', () => {
  afterEach(async () => {
    await WeaponModel.deleteMany();
  });

  describe('creating', () => {
    it('rejects when there is no name', async () => {
      const uut = new WeaponModel();
      uut.description = 'A weapon';
      uut.properties.push('heavy');
      uut.properties.push('reach');
      uut.damageType = 'slashing';
      uut.weaponType = 'martial';
      uut.classRestriction.push('fighter');
      uut.levelRestriction = 5;
      uut.weight = 3;
      uut.minDamage = 2;
      uut.maxDamage = 12;
      await assert.rejects(uut.save());
    });

    it('reject when there is no damageType', async () => {
      const uut = new WeaponModel();
      uut.name = 'test';
      uut.description = 'A weapon';
      uut.properties.push('heavy');
      uut.properties.push('reach');
      uut.weaponType = 'martial';
      uut.classRestriction.push('fighter');
      uut.levelRestriction = 5;
      uut.weight = 3;
      uut.minDamage = 2;
      uut.maxDamage = 12;
      await assert.rejects(uut.save());
    });

    it('reject when there is no weaponType', async () => {
      const uut = new WeaponModel();
      uut.name = 'test';
      uut.description = 'A weapon';
      uut.properties.push('heavy');
      uut.properties.push('reach');
      uut.damageType = 'slashing';
      uut.classRestriction.push('fighter');
      uut.levelRestriction = 5;
      uut.weight = 3;
      uut.minDamage = 2;
      uut.maxDamage = 12;
      await assert.rejects(uut.save());
    });

    it('creates the weapon', async () => {
      const uut = new WeaponModel();
      uut.name = 'test';
      uut.description = 'A weapon';
      uut.properties.push('heavy');
      uut.properties.push('reach');
      uut.damageType = 'slashing';
      uut.weaponType = 'martial';
      uut.classRestriction.push('fighter');
      uut.levelRestriction = 5;
      uut.weight = 3;
      uut.minDamage = 2;
      uut.maxDamage = 12;
      await uut.save();
      assert(uut);
    });
  });
});
