//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';
import FactionManager from '../../../../build/game/characters/helpers/FactionManager.js';
import FactionModel from '../../../../build/db/models/FactionModel.js';

describe('FactionManager', () => {

  afterEach(async () => {
    await FactionModel.deleteMany();
  });

  describe('initializeFaction', () => {
    let character;

    beforeEach(async () => {
      character = {
        getAttributeModifier: () => {
          return 2;
        },
        sendImmediate: () => {},
        id: 'id-1',
        name: 'char name',
      };

      const faction = new FactionModel();
      faction.name = 'Test Faction';
      faction.positiveModifier = 5;
      faction.negativeModifier = 10;
      await faction.save();
    });

    describe('when the character already has a faction', () => {
      it('does nothing', async () => {
        const uut = new FactionManager(character);
        await uut.adjustFaction('Test Faction', 0);
        assert(Object.keys(uut.factions).length === 1);
        assert(uut.factions['Test Faction'].score === 52);
        await uut.initializeFaction('Test Faction', 75);
        assert(uut.factions['Test Faction'].score === 52);
      });
    });

    describe('when the faction is not set on the character', () => {
      it('sets the initial value', async () => {
        const uut = new FactionManager(character);
        await uut.initializeFaction('Test Faction', 75);
        assert(Object.keys(uut.factions).length === 1);
        assert(uut.factions['Test Faction'].score === 75);
      });
    });
  });

  describe('adjustFaction', () => {
    let character;

    beforeEach(async () => {
      character = {
        getAttributeModifier: () => {
          return 2;
        },
        sendImmediate: () => {},
        id: 'id-1',
        name: 'char name',
      };

      const faction = new FactionModel();
      faction.name = 'Test Faction';
      faction.positiveModifier = 5;
      faction.negativeModifier = 10;
      await faction.save();
    });

    describe('when the faction is not known', () => {
      it('handles it without blowing up', async () => {
        const uut = new FactionManager(character);
        await uut.adjustFaction('do not exist', 1);
        assert(Object.keys(uut.factions).length === 0);
      });
    });

    describe('when the faction has not yet been accessed', () => {
      it('loads it and adjusts the score', async () => {
        const uut = new FactionManager(character);
        assert(Object.keys(uut.factions).length === 0);
        await uut.adjustFaction('Test Faction', 1);
        assert(Object.keys(uut.factions).length === 1);
        assert(uut.factions['Test Faction'].score === 53);
      });
    });

    describe('when the faction exists', () => {
      it('loads it and adjusts the score', async () => {
        const uut = new FactionManager(character);
        await uut.adjustFaction('Test Faction', 1);
        assert(uut.factions['Test Faction'].score === 53);
        await uut.adjustFaction('Test Faction', -1);
        assert(uut.factions['Test Faction'].score === 52);
      });
    });
  });

  describe('factionScores', () => {
    let character;

    beforeEach(async () => {
      character = {
        getAttributeModifier: () => {
          return 0;
        },
        sendImmediate: () => {},
        id: 'id-1',
        name: 'char name',
      };
    });

    describe('no factions', () => {
      it('returns an empty list', () => {
        const uut = new FactionManager(character);
        const result = uut.factionScores();
        assert(result.length === 0);
      });
    });

    describe('factions', () => {
      beforeEach(async () => {
        const faction1 = new FactionModel();
        faction1.name = 'Test1';
        faction1.positiveModifier = 5;
        faction1.negativeModifier = 10;
        await faction1.save();

        const faction2 = new FactionModel();
        faction2.name = 'Test2';
        faction2.positiveModifier = 2;
        faction2.negativeModifier = 2;
        await faction2.save();
      });

      it('returns a list', async () => {
        const uut = new FactionManager(character);
        await uut.adjustFaction('Test1', 1);
        await uut.adjustFaction('Test2', 1);
        const result = uut.factionScores();
        assert(result.length === 2);
        assert(result[0].name === 'Test1');
        assert(result[0].positiveModifier === 5);
        assert(result[0].negativeModifier === 10);
        assert(result[0].score === 51);
        assert(result[1].name === 'Test2');
        assert(result[1].positiveModifier === 2);
        assert(result[1].negativeModifier === 2);
        assert(result[1].score === 51);
      });
    });
  });

  describe('processKill', () => {
    let character;
    let deadCharacter;

    beforeEach(async () => {
      character = {
        getAttributeModifier: () => {
          return 2;
        },
        sendImmediate: () => {},
        id: 'id-1',
        name: 'char name',
      };

      deadCharacter = {
        getAttributeModifier: () => {
          return 2;
        },
        sendImmediate: () => {},
        id: 'id-2',
        name: 'dead name',
      };
      deadCharacter.factions = new FactionManager(deadCharacter);

      const faction1 = new FactionModel();
      faction1.name = 'Test1';
      faction1.positiveModifier = 5;
      faction1.negativeModifier = 10;
      await faction1.save();
      await deadCharacter.factions.adjustFaction('Test1', -100);

      const faction2 = new FactionModel();
      faction2.name = 'Test2';
      faction2.positiveModifier = 2;
      faction2.negativeModifier = 2;
      await faction2.save();
      await deadCharacter.factions.adjustFaction('Test2', 100);
    });

    it('adjusts factions correctly', async () => {
      const uut = new FactionManager(character);
      await uut.processKill(deadCharacter);
      assert(uut.factions['Test1']);
      assert(uut.factions['Test1'].score === 61);
      assert(uut.factions['Test2']);
      assert(uut.factions['Test2'].score === 44);
    });
  });
});
