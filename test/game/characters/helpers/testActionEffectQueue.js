//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import ActionEffectQueue from '../../../../build/game/characters/helpers/ActionEffectQueue.js';

describe('ActionEffectQueue', () => {
  describe('push', () => {
    it('does not call the onInitialPush callback if it does not exist', () => {
      const uut = new ActionEffectQueue();
      uut.push({});
      assert(uut.length === 1);
    });

    it('calls the onInitialPush callback if it exists', () => {
      let callbackCalled = false;
      const uut = new ActionEffectQueue();
      uut.push({ onInitialPush: () => {
        callbackCalled = true;
      }});
      assert(uut.length === 1);
      assert(callbackCalled);
    });
  });

  describe('find', () => {
    it('returns null when the item does not exist', () => {
      const uut = new ActionEffectQueue();
      uut.push({ value: 1 });
      uut.push({ value: 2 });
      const result = uut.find((v) => v.value === 3);
      assert(!result);
    });

    it('finds the right item', () => {
      const uut = new ActionEffectQueue();
      uut.push({ value: 1 });
      uut.push({ value: 2 });
      const result = uut.find((v) => v.value === 2);
      assert(result.value === 2);
    });
  });

  describe('every', () => {
    it('returns true if every item matches', () => {
      const uut = new ActionEffectQueue();
      uut.push({ value: 1 });
      uut.push({ value: 2 });
      assert(uut.every((v) => v.value > 0) === true);
    });

    it('returns false if any item does not match', () => {
      const uut = new ActionEffectQueue();
      uut.push({ value: 2 });
      uut.push({ value: 0 });
      assert(uut.every((v) => v.value > 0) === false);
    });
  });

  describe('remove', () => {
    it('removes the item if it matches', () => {
      const item1 = { value: 1 };
      const item2 = { value: 2 };
      const uut = new ActionEffectQueue();
      uut.push(item1);
      uut.push(item2);
      uut.remove(item1);
      assert(uut.length === 1);
    });

    it('does not remove if the item does not match', () => {
      const item1 = { value: 1 };
      const item2 = { value: 2 };
      const uut = new ActionEffectQueue();
      uut.push(item2);
      uut.remove(item1);
      assert(uut.length === 1);
    });
  });

  describe('decrementAndExpire', () => {
    it('decrements the ticks on all items in the queue', () => {
      const item1 = { tick: 2 };
      const item2 = { tick: 3 };
      const uut = new ActionEffectQueue();
      uut.push(item1);
      uut.push(item2);
      assert(uut.decrementAndExpire().length === 0);
      assert(item1.tick === 1);
      assert(item2.tick === 2);
    });

    it('returns the items that have a tick count of 0', () => {
      const item1 = { tick: 2 };
      const item2 = { tick: 3 };
      const item3 = { tick: 1 };
      const uut = new ActionEffectQueue();
      uut.push(item1);
      uut.push(item2);
      uut.push(item3);
      const result = uut.decrementAndExpire();
      assert(result.length === 1);
      assert(result[0] === item3);
      assert(item1.tick === 1);
      assert(item2.tick === 2);
    });

    it('calls the onExpire callback if it exists', () => {
      let item1Expired = false;
      let item2Expired = false;
      let item3Expired = false;
      const item1 = { tick: 2, onExpire: () => {
        item1Expired = true;
      }};
      const item2 = { tick: 3, onExpire: () => {
        item2Expired = true;
      }};
      const item3 = { tick: 1, onExpire: () => {
        item3Expired = true;
      }};
      const uut = new ActionEffectQueue();
      uut.push(item1);
      uut.push(item2);
      uut.push(item3);
      const result = uut.decrementAndExpire();
      assert(result.length === 1);
      assert(result[0] === item3);
      assert(item1.tick === 1);
      assert(item2.tick === 2);
      assert(item1Expired === false);
      assert(item2Expired === false);
      assert(item3Expired === true);
    });

    it('calls the onTick callback if it exists', () => {
      let item1Tick = false;
      let item2Tick = false;
      let item3Tick = false;
      const item1 = { tick: 2, onTick: () => {
        item1Tick = true;
      }};
      const item2 = { tick: 3, onTick: () => {
        item2Tick = true;
      }};
      const item3 = { tick: 1, onTick: () => {
        item3Tick = true;
      }};
      const uut = new ActionEffectQueue();
      uut.push(item1);
      uut.push(item2);
      uut.push(item3);
      const result = uut.decrementAndExpire();
      assert(result.length === 1);
      assert(result[0] === item3);
      assert(item1.tick === 1);
      assert(item2.tick === 2);
      assert(item1Tick === true);
      assert(item2Tick === true);
      assert(item3Tick === false);
    });

    it('ejects items that the onTick handler decremented', () => {
      let item1Tick = false;
      const item1 = { tick: 2, onTick: function () {
        item1Tick = true;
        this.tick = 0;
      }};
      const uut = new ActionEffectQueue();
      uut.push(item1);
      const result = uut.decrementAndExpire();
      assert(item1Tick);
      assert(result.length === 1);
      assert(uut.length === 0);
    });
  });
});
