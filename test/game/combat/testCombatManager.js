//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { createWorld, destroyWorld } from '../fixtures.js';
import CharacterModel from '../../../build/db/models/CharacterModel.js';
import FactionModel from '../../../build/db/models/FactionModel.js';
import Animal from '../../../build/game/characters/Animal.js';
import Character from '../../../build/game/characters/Character.js';
import CombatManager from '../../../build/game/combat/CombatManager.js';


describe('CombatManager', () => {
  let char1;
  let char2;
  let char3;

  beforeEach(async () => {
    const result = await createWorld();
    const world = result.world;

    const char1Model = new CharacterModel();
    char1Model.name = 'dog-man';
    char1Model.roomId = world.areas[1].rooms[0].id;
    char1Model.race = 'animal';
    char1Model.attributes = {
      strength: { base: 18, },
      dexterity: { base: 10 },
      constitution: { base: 10 },
      intelligence: { base: 10 },
      wisdom: { base: 10 },
      charisma: { base: 10 },
      hitpoints: { base: 6, current: 6 },
      manapoints: { base: 0, current: 0 },
      energypoints: { base: 80, current: 80 },
    };

    const char2Model = new CharacterModel();
    char2Model.name = 'cat-man1';
    char2Model.roomId = world.areas[1].rooms[0].id;
    char2Model.race = 'animal';
    char2Model.attributes = {
      strength: { base: 10, },
      dexterity: { base: 10 },
      constitution: { base: 10 },
      intelligence: { base: 10 },
      wisdom: { base: 10 },
      charisma: { base: 10 },
      hitpoints: { base: 1, current: 1 },
      manapoints: { base: 0, current: 0 },
      energypoints: { base: 80, current: 80 },
    };

    const char3Model = new CharacterModel();
    char3Model.name = 'cat-man2';
    char3Model.roomId = world.areas[1].rooms[0].id;
    char3Model.race = 'animal';
    char3Model.attributes = {
      strength: { base: 18, },
      dexterity: { base: 10 },
      constitution: { base: 10 },
      intelligence: { base: 10 },
      wisdom: { base: 10 },
      charisma: { base: 10 },
      hitpoints: { base: 6, current: 6 },
      manapoints: { base: 0, current: 0 },
      energypoints: { base: 80, current: 80 },
    };

    await char1Model.save();
    await char2Model.save();
    await char3Model.save();

    char1 = new Animal(char1Model, world);
    await char1.load();

    char2 = new Animal(char2Model, world);
    await char2.load();

    char3 = new Animal(char3Model, world);
    await char3.load();
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('checkCombat', () => {
    describe('if the character is in combat', () => {
      it('returns true', () => {
        const uut = new CombatManager();
        uut.addCombat(char1, char2);
        assert(uut.checkCombat(char1) === true);
        assert(uut.checkCombat(char2) === true);
      });
    });

    describe('if the character is not in combat', () => {
      it('returns false', () => {
        const uut = new CombatManager();
        uut.addCombat(char1, char2);
        assert(uut.checkCombat(char3) === false);
      });
    });
  });

  describe('addCombat', () => {
    describe('when the attacker is already fighting', () => {
      it('returns false', () => {
        const uut = new CombatManager();
        assert(uut.addCombat(char1, char2) !== null);
        assert(uut.addCombat(char1, char3) === null);
      });
    });

    describe('when the attacker is not already fighting', () => {
      it('creates a new combat between two characters and returns true', () => {
        const uut = new CombatManager();
        assert(uut.addCombat(char1, char2) !== null);
      });
    });
  });

  describe('combats', () => {
    it('returns 0 if there are no combats', () => {
      const uut = new CombatManager();
      assert(uut.combats === 0);
    });

    it('returns the right number of combats', () => {
      const uut = new CombatManager();
      uut.addCombat(char1, char2);
      assert(uut.combats === 1);
      uut.addCombat(char2, char3);
      assert(uut.combats === 2);
    });
  });

  describe('getCombat', () => {
    it('returns null if the character is not in combat', () => {
      const uut = new CombatManager();
      uut.addCombat(char1, char2);
      assert(uut.getCombat(char3) === null);
      assert(uut.getCombat(char2) === null);
    });

    it('returns the combat if the character is the attacker', () => {
      const uut = new CombatManager();
      uut.addCombat(char1, char2);
      assert(uut.getCombat(char1));
    });
  });

  describe('onTick', () => {
    describe('with A fighting B, B fighting C, C fighting A', () => {
      describe('when a character dies', () => {
        it('removes any combats referencing that character', async () => {
          const uut = new CombatManager();
          assert(uut.addCombat(char1, char2) !== null);
          uut.getCombat(char1).setNextAttackRoll(20);
          assert(uut.addCombat(char2, char3) !== null);
          assert(uut.addCombat(char3, char1) !== null);
          await uut.onTick();
          assert(uut.combats < 3);
          assert(char1.currentState === Character.STATE.FIGHTING);
          assert(char3.currentState === Character.STATE.FIGHTING);
        });
      });
    });

    describe('with A fighting B, B fighting A, C fighting A', () => {
      describe('when a character dies', () => {
        it('removes any combats referencing that character', async () => {
          const uut = new CombatManager();
          uut.addCombat(char1, char2);
          uut.getCombat(char1).setNextAttackRoll(20);
          uut.addCombat(char2, char1);
          uut.addCombat(char3, char1);
          await uut.onTick();
          assert(uut.combats < 3);
          assert(char1.currentState === Character.STATE.FIGHTING);
          assert(char3.currentState === Character.STATE.FIGHTING);
        });
      });
    });

    describe('with A fighting B, B fighting A', () => {
      describe('when a character dies', () => {
        it('removes any combats referencing that character', async () => {
          const uut = new CombatManager();
          uut.addCombat(char1, char2);
          uut.addCombat(char2, char1);
          uut.getCombat(char1).setNextAttackRoll(20);
          await uut.onTick();
          assert(uut.combats === 0);
          assert(char1.currentState === Character.STATE.NORMAL);
        });
      });

      describe('when the characters have factions', () => {
        beforeEach(async () => {
          const faction = new FactionModel();
          faction.name = 'Test1';
          faction.positiveModifier = 5;
          faction.negativeModifier = 5;
          await faction.save();
          await char2.factions.adjustFaction('Test1', -100);
        });

        afterEach(async () => {
          await FactionModel.deleteMany();
        });

        it('resolves the combat and adjusts factions correctly', async () => {
          const uut = new CombatManager();
          uut.addCombat(char1, char2);
          uut.getCombat(char1).setNextAttackRoll(20);
          await uut.onTick();
          assert(char1.currentState === Character.STATE.NORMAL);
          const scores = char1.factions.factionScores();
          assert(scores.length === 1);
          assert(scores[0].score === 59);
        });
      });
    });
  });
});
