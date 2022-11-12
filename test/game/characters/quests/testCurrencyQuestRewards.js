//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import CurrencyQuestReward from '../../../../build/game/characters/quests/CurrencyQuestReward.js';

describe('CurrencyQuestReward', () => {
  describe('reward', () => {
    it('deposits money and displays the right thing when the quantity is 1', () => {
      let message;
      let name;
      let quantity;
      const uut = new CurrencyQuestReward({ data: { name: 'gold', quantity: 1 }});
      uut.reward(
        {
          toShortText: () => 'test',
        },
        {
          sendImmediate: (msg) => {
            message = msg;
          },
          currencies: {
            deposit: (n, q) => {
              name = n;
              quantity = q;
            },
          },
        }, {});
      assert(name === 'gold', name);
      assert(quantity === 1, quantity);
      assert(message === 'You receive 1 gold coin from test.', message);
    });

    it('deposits money and displays the right thing when the quantity is >1', () => {
      let message;
      let name;
      let quantity;
      const uut = new CurrencyQuestReward({ data: { name: 'gold', quantity: 10 }});
      uut.reward(
        {
          toShortText: () => 'test',
        },
        {
          sendImmediate: (msg) => {
            message = msg;
          },
          currencies: {
            deposit: (n, q) => {
              name = n;
              quantity = q;
            },
          },
        }, {});
      assert(name === 'gold', name);
      assert(quantity === 10, quantity);
      assert(message === 'You receive 10 gold coins from test.', message);
    });

  });
});