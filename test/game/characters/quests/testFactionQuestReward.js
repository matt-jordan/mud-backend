//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import FactionQuestReward from '../../../../build/game/characters/quests/FactionQuestReward.js';

describe('FactionQuestReward', () => {
  describe('reward', () => {
    it('adjusts the faction of the character', () => {
      let setName = '';
      let setBonus = 0;
      const uut = new FactionQuestReward({ data: { faction: 'test', bonus: 50 }});
      uut.reward({}, {
        factions: {
          adjustFaction: (name, bonus) => {
            setName = name;
            setBonus = bonus;
          },
        },
      }, {});
      assert(setName === 'test');
      assert(setBonus === 50);
    });
  });
});