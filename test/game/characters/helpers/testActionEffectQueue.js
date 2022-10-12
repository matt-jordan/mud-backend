//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import ActionEffectQueue from '../../../../src/game/characters/helpers/ActionEffectQueue.js';

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
      assert(item1Tick=== true);
      assert(item2Tick === true);
      assert(item3Tick === false);
    });
  });
});
