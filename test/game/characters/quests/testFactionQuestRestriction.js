//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import FactionModel from '../../../../src/db/models/FactionModel.js';
import FactionManager from '../../../../src/game/characters/helpers/FactionManager.js';
import FactionQuestRestriction from '../../../../src/game/characters/quests/FactionQuestRestriction.js';

describe('FactionQuestRestriction', () => {
  describe('check', () => {
    let character;

    beforeEach(async () => {
      const model = new FactionModel();
      model.name = 'Test Faction';
      await model.save();

      character = {
        factions: null,
        getAttributeModifier: () => { return 0; },
        sendImmediate: () => {},
      };
      character.factions = new FactionManager(character);
      await character.factions.adjustFaction('Test Faction', 0);
    });

    afterEach(async () => {
      await FactionModel.deleteMany();
    });

    it('returns true when the faction check passes', () => {
      const uut = new FactionQuestRestriction({ data: { faction: 'Test Faction', minFaction: 5 }});
      assert(uut.check(character) === true);
    });

    it('returns false when the faction check fails', () => {
      const uut = new FactionQuestRestriction({ data: { faction: 'Test Faction', minFaction: 90 }});
      assert(uut.check(character) === false);
    });

    it('returns false when the faction is unkown', () => {
      const uut = new FactionQuestRestriction({ data: { faction: 'Test', minFaction: 1 }});
      assert(uut.check(character) === false);
    });
  });
});
