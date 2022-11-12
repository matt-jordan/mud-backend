
import assert from 'power-assert';

import { ObjectContainer } from '../../build/game/ObjectContainer.js';

describe('ObjectContainer', () => {
  describe('addItem', () => {
    let item;

    beforeEach(() => {
      item = {
        name: 'test',
      };
    });

    it('adds the item to the underlying container', () => {
      const uut = new ObjectContainer();
      uut.addItem(item);
      assert(uut.objects.length === 1);
    });
  });

  describe('length', () => {
    it('returns the right value', () => {
      const uut = new ObjectContainer();
      uut.addItem({ name: 'test' });
      assert(uut.objects.length === uut.length);
      uut.addItem({ name: 'test2' });
      assert(uut.objects.length === uut.length);
    });
  });

  describe('all', () => {
    it('returns the underlying array', () => {
      const uut = new ObjectContainer();
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
    describe('when items have qualifiers', () => {
      it('ignores the qualifier', () => {
        const uut = new ObjectContainer();
        uut.addItem({ name: 'gold (50)' });
        uut.addItem({ name: 'gold' });
        uut.addItem({ name: 'silver (100)' });
        const gold50 = uut.findItem('gold (50)');
        assert(gold50);
        assert(gold50.name === 'gold (50)');
        const gold2 = uut.findItem('1.gold');
        assert(gold2);
        assert(gold2.name === 'gold');
        const gold = uut.findItem('gold');
        assert(gold);
        assert(gold.name === 'gold (50)');
        const silver = uut.findItem('silver');
        assert(silver);
        assert(silver.name === 'silver (100)');
      });
    });

    describe('when no items match', () => {
      it('returns null', () => {
        const uut = new ObjectContainer();
        const item1 = uut.findItem('test');
        assert(item1 === null);
        uut.addItem({ name: 'test' });
        const item2 = uut.findItem('test2');
        assert(item2 === null);
      });
    });

    describe('when there is one item that matches', () => {
      it('matches on case insensitive lookups', () => {
        const uut = new ObjectContainer();
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
        const uut = new ObjectContainer();
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
        const uut = new ObjectContainer();
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
        const uut = new ObjectContainer();
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
        const uut = new ObjectContainer();
        uut.addItem({ name: 'test1', id: 1 });
        uut.addItem({ name: 'test2', id: 2 });
        uut.addItem({ name: 'test3', id: 30 });
        uut.addItem({ name: 'test3', id: 31 });
        uut.addItem({ name: 'test3', id: 32 });
        const item3 = uut.findItem('4.test3');
        assert(item3 === null);
      });

      it('returns null if the specifier is invalid', () => {
        const uut = new ObjectContainer();
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
        const uut = new ObjectContainer();
        const item1 = uut.findAndRemoveItem('test');
        assert(item1 === null);
        uut.addItem({ name: 'test' });
        const item2 = uut.findAndRemoveItem('test2');
        assert(item2 === null);
      });
    });

    describe('when there is one item that matches', () => {
      it('matches on case insensitive lookups', () => {
        const uut = new ObjectContainer();
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
        const uut = new ObjectContainer();
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
        const uut = new ObjectContainer();
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
        const uut = new ObjectContainer();
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
        const uut = new ObjectContainer();
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

