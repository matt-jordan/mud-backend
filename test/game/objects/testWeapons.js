//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import WeaponModel from '../../../src/db/models/WeaponModel.js';
import Weapon from '../../../src/game/objects/Weapon.js';
import longswordFactory from '../../../src/game/objects/factories/longsword.js';
import maceFactory from '../../../src/game/objects/factories/mace.js';
import shortswordFactory from '../../../src/game/objects/factories/shortsword.js';

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
  [
    { damageType: 'slashing', verbFirstPerson: 'slash', verbThirdPerson: 'slashes' },
    { damageType: 'bludgeoning', verbFirstPerson: 'smash', verbThirdPerson: 'smashes' },
    { damageType: 'piercing', verbFirstPerson: 'pierce', verbThirdPerson: 'pierces' },
  ].forEach((damageTypeTest) => {
    describe(damageTypeTest.damageType, () => {
      let model;

      beforeEach(async () => {
        model = new WeaponModel();
        model.name = 'Test';
        model.description = 'A test weapon';
        model.weight = 2;
        model.minDamage = 10;
        model.maxDamage = 20;
        model.durability.current = 5;
        model.durability.base = 10;
        model.weaponType = 'simple';
        model.damageType = damageTypeTest.damageType;
        await model.save();
      });

      describe('verbs', () => {
        it('returns the expected verb tenses', async () => {
          const uut = new Weapon(model);
          await uut.load();
          assert(uut.verbs.firstPerson === damageTypeTest.verbFirstPerson);
          assert(uut.verbs.thirdPerson === damageTypeTest.verbThirdPerson);
        });
      });

      describe('attack', () => {
        it('converts the weapon to basic attack object', async () => {
          const uut = new Weapon(model);
          await uut.load();
          const attack = uut.toAttack({ getSkill: () => 1 });
          assert(attack.verbs.firstPerson === damageTypeTest.verbFirstPerson);
          assert(attack.verbs.thirdPerson === damageTypeTest.verbThirdPerson);
          assert(attack.minDamage === uut.minDamage);
          assert(attack.maxDamage === uut.maxDamage);
          assert(attack.name === uut.name);
        });
      });

      describe('destroy', () => {
        it('destroys the item', async () => {
          const uut = new Weapon(model);
          await uut.load();
          const id = uut.id;

          await uut.destroy();
          const shouldNotExist = await WeaponModel.findById(id);
          assert(!shouldNotExist);
        });
      });
    });
  });

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