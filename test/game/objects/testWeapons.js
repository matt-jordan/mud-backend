//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import {
  Weapon,
  longswordFactory,
  maceFactory,
  shortswordFactory,
} from '../../../src/game/objects/Weapon.js';
import WeaponModel from '../../../src/db/models/WeaponModel.js';

[ longswordFactory, maceFactory, shortswordFactory ].forEach((factory) => {
  describe('A specific weapon factory', () => {
    it('creates a weapon', async () => {
      const weapon = await factory();
      assert(weapon);
      assert(weapon.id);
      assert(weapon.name);
      assert(weapon.description);
      assert(weapon.weight > 0);
      assert(weapon.minDamage > 0);
      assert(weapon.maxDamage > 0);
      assert(weapon.durability.current !== 0);
      assert(weapon.durability.base !== 0);
      assert(weapon.model);
    });
  });
});

describe('Weapon', () => {
  describe('load', () => {
    afterEach(() => {
      WeaponModel.deleteMany();
    });

    it('loads the weapon with the expected properties and accessors', async () => {
      const model = new WeaponModel();
      model.name = 'Test';
      model.description = 'A test weapon';
      model.weight = 2;
      model.minDamage = 10;
      model.maxDamage = 20;
      model.durability.current = 5;
      model.durability.base = 10;
      model.weaponType = 'simple';
      model.damageType = 'piercing';
      await model.save();

      const uut = new Weapon(model);
      assert(uut);
      await uut.load();

      assert(uut.name === model.name);
      assert(uut.description === model.description);
      assert(uut.weight === model.weight);
      assert(uut.minDamage === model.minDamage);
      assert(uut.maxDamage === model.maxDamage);
      assert(uut.durability.current === uut.model.durability.current);
      assert(uut.durability.base === uut.model.durability.base);
    });
  });

  describe('save', () => {
    afterEach(() => {
      WeaponModel.deleteMany();
    });

    it('saves the weapon properties that are mutable', async () => {
      let model = new WeaponModel();
      model.name = 'Test';
      model.description = 'A test weapon';
      model.weight = 2;
      model.minDamage = 10;
      model.maxDamage = 20;
      model.durability.current = 5;
      model.durability.base = 10;
      model.weaponType = 'simple';
      model.damageType = 'piercing';
      await model.save();

      const uut = new Weapon(model);
      await uut.load();

      uut.durability.current = 4;
      uut.durability.base = 5;
      await uut.save();

      model = await WeaponModel.findById(uut.id);
      assert(model);
      assert(model.durability.current === 4);
      assert(model.durability.base === 5);
    });
  });
});