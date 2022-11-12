//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import LevelQuestRestriction from '../../../../build/game/characters/quests/LevelQuestRestriction.js';

describe('LevelQuestRestriction', () => {
  describe('check', () => {
    it('returns false when the level check fails the min level', () => {
      const uut = new LevelQuestRestriction({ data: { minLevel: 3, maxLevel: 4 }});
      assert(uut.check({ getLevel: () => { return 1; }}) === false);
    });

    it('returns false when the level check fails the max level', () => {
      const uut = new LevelQuestRestriction({ data: { minLevel: 1, maxLevel: 3 }});
      assert(uut.check({ getLevel: () => { return 4; }}) === false);
    });

    it('returns true when the level check is between the min and max', () => {
      const uut = new LevelQuestRestriction({ data: { minLevel: 2, maxLevel: 4 }});
      assert(uut.check({ getLevel: () => { return 3; }}) === true);
    });
  });
});
