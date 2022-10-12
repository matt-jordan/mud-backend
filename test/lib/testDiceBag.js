//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import DiceBag from '../../src/lib/DiceBag.js';

describe('DiceBag', () => {

  it('generates the expected values for a single set', () => {
    const bag = new DiceBag(1, 6, 1);
    const results = [];
    for (let i = 0; i < 6; i += 1) {
      results.push(bag.getRoll());
    }
    results.sort();
    for (let i = 0; i < 6; i += 1) {
      assert(results[i] === i + 1);
    }
  });

  it('generates the expected values for multiple sets', () => {
    const bag = new DiceBag(1, 4, 4);
    const results = [];
    for (let i = 0; i < 16; i += 1) {
      results.push(bag.getRoll());
    }
    results.sort();
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 4; j += 1) {
        assert(results[i * 4 + j] === i + 1);
      }
    }
  });

  it('generates expected sets when we exhaust the bag', () => {
    const bag = new DiceBag(1, 8, 1);
    const results = [];
    for (let i = 0; i < 16; i += 1) {
      results.push(bag.getRoll());
    }
    results.sort();
    for (let i = 0; i < 8; i += 1) {
      for (let j = 0; j < 2; j += 1) {
        assert(results[i * 2 + j] === i + 1);
      }
    }
  });

  it('lets you overload the next N results and does not re-use them', () => {
    const bag = new DiceBag(1, 4, 1);
    bag.setNextResults([20, 10, 8]);
    assert(bag.getRoll() === 20);
    assert(bag.getRoll() === 10);
    assert(bag.getRoll() === 8);
    const results = [];
    for (let i = 0; i < 8; i += 1) {
      results.push(bag.getRoll());
    }
    results.sort();
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 2; j += 1) {
        assert(results[i * 2 + j] === i + 1);
      }
    }
  });
});
