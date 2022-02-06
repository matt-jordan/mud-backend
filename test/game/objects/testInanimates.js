//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import WeaponModel from '../../../src/db/models/WeaponModel.js';
import { Weapon } from '../../../src/game/objects/weapons.js';
import { InanimateContainer, loadInanimate } from '../../../src/game/objects/inanimates.js';

describe('InanimateContainer', () => {
  describe('addItem', () => {
    let item;

    beforeEach(() => {
      item = {
        name: 'test',
      };
    });

    it('adds the item to the underlying container', () => {
      const uut = new InanimateContainer();
      uut.addItem(item);
      assert(uut.inanimates.length === 1);
    });
  });

  describe('length', () => {
    it('returns the right value', () => {
      const uut = new InanimateContainer();
      uut.addItem({ name: 'test' });
      assert(uut.inanimates.length === uut.length);
      uut.addItem({ name: 'test2' });
      assert(uut.inanimates.length === uut.length);
    });
  });

  describe('all', () => {
    it('returns the underlying array', () => {
      const uut = new InanimateContainer();
      uut.addItem({ name: 'test1' });
      uut.addItem({ name: 'test2' });
      uut.addItem({ name: 'test3' });
      const array = uut.all;
      assert(array.length === 3);
      assert(array[0].name === 'test1');
      assert(array[1].name === 'test2');
      assert(array[2].name === 'test3');
    });
  });

  describe('findItem', () => {
    describe('when no items match', () => {
      it('returns null', () => {
        const uut = new InanimateContainer();
        const item1 = uut.findItem('test');
        assert(item1 === null);
        uut.addItem({ name: 'test' });
        const item2 = uut.findItem('test2');
        assert(item2 === null);
      });
    });

    describe('when there is one item that matches', () => {
      it('matches on case insensitive lookups', () => {
        const uut = new InanimateContainer();
        uut.addItem({ name: 'test1', id: 1 });
        uut.addItem({ name: 'test2', id: 2 });
        uut.addItem({ name: 'test3', id: 30 });
        uut.addItem({ name: 'test3', id: 31 });
        uut.addItem({ name: 'test3', id: 32 });
        const item1 = uut.findItem('TEST1');
        assert(item1);
        assert(item1.name === 'test1');
      });

      it('returns the matched item', () => {
        const uut = new InanimateContainer();
        uut.addItem({ name: 'test1', id: 1 });
        uut.addItem({ name: 'test2', id: 2 });
        uut.addItem({ name: 'test3', id: 30 });
        uut.addItem({ name: 'test3', id: 31 });
        uut.addItem({ name: 'test3', id: 32 });
        const item1 = uut.findItem('test1');
        assert(item1);
        assert(item1.name === 'test1');
      });
    });

    describe('when more than one item matches', () => {
      it('returns the first one if nothing is specified', () => {
        const uut = new InanimateContainer();
        uut.addItem({ name: 'test1', id: 1 });
        uut.addItem({ name: 'test2', id: 2 });
        uut.addItem({ name: 'test3', id: 30 });
        uut.addItem({ name: 'test3', id: 31 });
        uut.addItem({ name: 'test3', id: 32 });
        const item3 = uut.findItem('test3');
        assert(item3);
        assert(item3.name === 'test3');
        assert(item3.id === 30);
      });

      it('returns the correct item when a specifier is used', () => {
        const uut = new InanimateContainer();
        uut.addItem({ name: 'test1', id: 1 });
        uut.addItem({ name: 'test2', id: 2 });
        uut.addItem({ name: 'test3', id: 30 });
        uut.addItem({ name: 'test3', id: 31 });
        uut.addItem({ name: 'test3', id: 32 });
        let item3 = uut.findItem('0.test3');
        assert(item3);
        assert(item3.name === 'test3');
        assert(item3.id === 30);
        item3 = uut.findItem('1.test3');
        assert(item3);
        assert(item3.name === 'test3');
        assert(item3.id === 31);
        item3 = uut.findItem('2.test3');
        assert(item3);
        assert(item3.name === 'test3');
        assert(item3.id === 32);
      });

      it('returns null if the specifier exceeds the matcheds items', () => {
        const uut = new InanimateContainer();
        uut.addItem({ name: 'test1', id: 1 });
        uut.addItem({ name: 'test2', id: 2 });
        uut.addItem({ name: 'test3', id: 30 });
        uut.addItem({ name: 'test3', id: 31 });
        uut.addItem({ name: 'test3', id: 32 });
        const item3 = uut.findItem('4.test3');
        assert(item3 === null);
      });

      it('returns null if the specifier is invalid', () => {
        const uut = new InanimateContainer();
        uut.addItem({ name: 'test1', id: 1 });
        uut.addItem({ name: 'test2', id: 2 });
        uut.addItem({ name: 'test3', id: 30 });
        uut.addItem({ name: 'test3', id: 31 });
        uut.addItem({ name: 'test3', id: 32 });
        let item3 = uut.findItem('.test3');
        assert(item3 === null);
        item3 = uut.findItem('a.test3');
        assert(item3 === null);
        item3 = uut.findItem('test3.');
        assert(item3 === null);
      });
    });
  });

  describe('findAndRemoveItem', () => {
    describe('when no items match', () => {
      it('returns null', () => {
        const uut = new InanimateContainer();
        const item1 = uut.findAndRemoveItem('test');
        assert(item1 === null);
        uut.addItem({ name: 'test' });
        const item2 = uut.findAndRemoveItem('test2');
        assert(item2 === null);
      });
    });

    describe('when there is one item that matches', () => {
      it('matches on case insensitive lookups', () => {
        const uut = new InanimateContainer();
        uut.addItem({ name: 'test1', id: 1 });
        uut.addItem({ name: 'test2', id: 2 });
        uut.addItem({ name: 'test3', id: 30 });
        uut.addItem({ name: 'test3', id: 31 });
        uut.addItem({ name: 'test3', id: 32 });
        const item1 = uut.findAndRemoveItem('TEST1');
        assert(item1);
        assert(item1.name === 'test1');
        assert(uut.length === 4);
      });

      it('removes & returns the matched item', () => {
        const uut = new InanimateContainer();
        uut.addItem({ name: 'test1', id: 1 });
        uut.addItem({ name: 'test2', id: 2 });
        uut.addItem({ name: 'test3', id: 30 });
        uut.addItem({ name: 'test3', id: 31 });
        uut.addItem({ name: 'test3', id: 32 });
        const item1 = uut.findAndRemoveItem('test1');
        assert(item1);
        assert(item1.name === 'test1');
        assert(uut.length === 4);
      });
    });

    describe('when more than one item matches', () => {
      it('removes & returns the first one if nothing is specified', () => {
        const uut = new InanimateContainer();
        uut.addItem({ name: 'test1', id: 1 });
        uut.addItem({ name: 'test2', id: 2 });
        uut.addItem({ name: 'test3', id: 30 });
        uut.addItem({ name: 'test3', id: 31 });
        uut.addItem({ name: 'test3', id: 32 });
        const item3 = uut.findAndRemoveItem('test3');
        assert(item3);
        assert(item3.name === 'test3');
        assert(item3.id === 30);
        assert(uut.length === 4);
      });

      it('removes & returns the correct item when a specifier is used', () => {
        const uut = new InanimateContainer();
        uut.addItem({ name: 'test1', id: 1 });
        uut.addItem({ name: 'test2', id: 2 });
        uut.addItem({ name: 'test3', id: 30 });
        uut.addItem({ name: 'test3', id: 31 });
        uut.addItem({ name: 'test3', id: 32 });
        const item3 = uut.findAndRemoveItem('1.test3');
        assert(item3);
        assert(item3.name === 'test3');
        assert(item3.id === 31);
        assert(uut.length === 4);
      });

      it('returns null if the specifier exceeds the matcheds items', () => {
        const uut = new InanimateContainer();
        uut.addItem({ name: 'test1', id: 1 });
        uut.addItem({ name: 'test2', id: 2 });
        uut.addItem({ name: 'test3', id: 30 });
        uut.addItem({ name: 'test3', id: 31 });
        uut.addItem({ name: 'test3', id: 32 });
        const item3 = uut.findAndRemoveItem('3.test3');
        assert(item3 === null);
        assert(uut.length === 5);
      });
    });
  });
});

describe('loadInanimates', () => {

  let weaponModelId;

  beforeEach(async () => {
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
    weaponModelId = model._id;
  });

  afterEach(async () => {
    await WeaponModel.deleteMany();
  });

  it('loads a weapon', async () => {
    const weapon = await loadInanimate({ inanimateId: weaponModelId, inanimateType: 'weapon' });
    assert(weapon);
    assert(weapon instanceof Weapon === true);
  });
});
