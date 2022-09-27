//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import CurrencyManager from '../../../../src/game/characters/helpers/CurrencyManager.js';

describe('CurrencyManager', () => {

  describe('deposit', () => {
    it('keeps track of multiple currencies', () => {
      const uut = new CurrencyManager();
      uut.deposit('gold', 100);
      uut.deposit('platinum', 50);
      assert(Object.keys(uut.currencies).length === 2);
      assert(uut.currencies['gold']._balance === 100);
      assert(uut.currencies['platinum']._balance === 50);
    });
  });

  describe('withdraw', () => {

    it('withdraws balances correctly', () => {
      const uut = new CurrencyManager();
      uut.deposit('gold', 50);
      assert(uut.withdraw('gold', 10) === 10);
    });

    it('returns 0 if it does not know the currency', () => {
      const uut = new CurrencyManager();
      assert(uut.withdraw('wat', 100) === 0);
    });

    it('returns the balance if you exceed the balance', () => {
      const uut = new CurrencyManager();
      uut.deposit('gold', 50);
      assert(uut.withdraw('gold', 100) === 50);
      assert(uut.withdraw('gold', 100) === 0);
    });

  });

  describe('balance', () => {
    it('returns the balance for a given currency', () => {
      const uut = new CurrencyManager();
      uut.deposit('gold', 50);
      assert(uut.balance('gold') === 50);
    });

    it('returns 0 if the currency is not known', () => {
      const uut = new CurrencyManager();
      uut.deposit('gold', 50);
      assert(uut.balance('wat') === 0);
    });

    it('returns the balance for all currencies if no type is given', () => {
      const uut = new CurrencyManager();
      uut.deposit('gold', 50);
      uut.deposit('platinum', 100);
      assert(uut.balance() === 150);
    });
  });

  describe('toJSON', () => {
    it('returns the expected json', () => {
      const uut = new CurrencyManager();
      uut.deposit('gold', 50);
      uut.deposit('platinum', 100);
      const result = uut.toJSON();
      assert(result.length === 2);
      assert(result[0].name === 'gold');
      assert(result[0].quantity === 50);
      assert(result[1].name === 'platinum');
      assert(result[1].quantity === 100);
    });
  });
});
