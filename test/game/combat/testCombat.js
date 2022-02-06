//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { createWorld, destroyWorld } from '../fixtures.js';
import CharacterModel from '../../../src/db/models/CharacterModel.js';
import Animal from '../../../src/game/characters/Animal.js';
import Combat from '../../../src/game/combat/Combat.js';


describe('Combat', () => {

  let char1;
  let char2;
  let world;

  beforeEach(async () => {
    const result = await createWorld();
    world = result.world;

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
    char2Model.name = 'cat-man';
    char2Model.roomId = world.areas[1].rooms[0].id;
    char2Model.race = 'animal';
    char2Model.attributes = {
      strength: { base: 10, },
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

    char1 = new Animal(char1Model, world);
    await char1.load();

    char2 = new Animal(char2Model, world);
    await char2.load();
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('if either combatant is dead', () => {
    describe ('if the attacker is dead', () => {
      beforeEach(() => {
        char1.attributes.hitpoints.current = 0;
      });

      it('resolves the combat', () => {
        const uut = new Combat(char1, char2);
        const result = uut.processRound();
        assert(result);
        assert(result === Combat.RESULT.ATTACKER_DEAD);
      });
    });

    describe('if the defender is dead', () => {
      beforeEach(() => {
        char2.attributes.hitpoints.current = 0;
      });

      it('resolves the combat', () => {
        const uut = new Combat(char1, char2);
        const result = uut.processRound();
        assert(result);
        assert(result === Combat.RESULT.DEFENDER_DEAD);
      });
    });
  });

  describe('if the attacker damages the defender', () => {
    describe('if it kills the defender', () => {
      beforeEach(() => {
        char2.attributes.hitpoints.current = 1;
      });

      it('resolves the combat', () => {
        const uut = new Combat(char1, char2);
        uut.setNextDiceRoll(20); // TODO: Likely to change in some fashion
        const result = uut.processRound();
        assert(result);
        assert(char2.attributes.hitpoints.current === 0);
        assert(result === Combat.RESULT.DEFENDER_DEAD);
      });
    });

    describe('if it does not kill the defender', () => {
      beforeEach(() => {
        char2.attributes.hitpoints.current = 100;
      });

      it('continues the combat', () => {
        const uut = new Combat(char1, char2);
        uut.setNextDiceRoll(20); // TODO: Likely to change in some fashion
        const result = uut.processRound();
        assert(result);
        assert(char2.attributes.hitpoints.current !== 100);
        assert(result === Combat.RESULT.CONTINUE);
      });
    });
  });

  describe('if the attacker misses the defender', () => {
    it('continues the combat', () => {
      const uut = new Combat(char1, char2);
      uut.setNextDiceRoll(1); // TODO: Likely to change in some fashion
      const result = uut.processRound();
      assert(result);
      assert(char2.attributes.hitpoints.current === 6);
      assert(result === Combat.RESULT.CONTINUE);
    });
  });
});
