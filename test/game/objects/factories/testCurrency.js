//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import currencyFactory from '../../../../build/game/objects/factories/currency.js';

describe('currencyFactory', () => {

  describe('creating a single coin', () => {
    it('creates it with the expected properties', async () => {
      const uut = await currencyFactory({ name: 'gold', quantity: 1 });
      assert(uut);
      assert(uut.name === 'gold');
      assert(uut.model.description === 'a gold coin');
      assert(uut.model.isCurrency);
      assert(uut.model.currencyProperties.name === 'gold');
      assert(uut.model.currencyProperties.quantity === 1);
    });
  });

  describe('creating a stack of coins', () => {
    it('creates it with the expected properties', async () => {
      const uut = await currencyFactory({ name: 'gold', quantity: 50 });
      assert(uut);
      assert(uut.name === 'gold (50)');
      assert(uut.model.description === '50 gold coins');
      assert(uut.model.isCurrency);
      assert(uut.model.currencyProperties.name === 'gold');
      assert(uut.model.currencyProperties.quantity === 50);
    });
  });

});