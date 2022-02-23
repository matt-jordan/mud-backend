//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { AttackFactory, AttackAction } from '../../../../src/game/commands/default/Attack.js';
import Animal from '../../../../src/game/characters/Animal.js';
import Character from '../../../../src/game/characters/Character.js';
import CharacterModel from '../../../../src/db/models/CharacterModel.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';

describe('AttackAction', () => {
  let pc;

  beforeEach(async () => {
    const results = await createWorld();
    pc = results.pc1;
    pc.transport = new FakeClient();

    const model = new CharacterModel();
    model.name = 'cat';
    model.age = 1;
    model.weight = 10;
    model.roomId = pc.room.id;
    model.race = 'animal';
    model.size = 'small';
    model.attributes = {
      strength: { base: 4, },
      dexterity: { base: 12 },
      constitution: { base: 4 },
      intelligence: { base: 6 },
      wisdom: { base: 4 },
      charisma: { base: 2 },
      hitpoints: { base: 20, current: 20 },
      manapoints: { base: 0, current: 0 },
      energypoints: { base: 80, current: 80 },
    };
    await model.save();

    const cat = new Animal(model, results.world);
    await cat.load();
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('when attacking', () => {
    it('does not start a combat if the character does not exist', (done) => {
      const uut = new AttackAction({ target: 'rat' });
      pc.transport.sentMessageCb = (msg) => {
        assert(msg);
        if (pc.transport.sentMessageCounter === 1) {
          assert.match(msg, /You do not see/);
          done();
        }
      };
      uut.execute(pc);
    });

    describe('when the character exists', () => {
      it('starts the combat by swinging away', (done) => {
        const uut = new AttackAction({ target: 'cat' });
        pc.transport.sentMessageCb = (msg) => {
          assert(msg);
          if (pc.transport.sentMessageCounter === 1) {
            assert.match(msg, /You attack a cat/);
          } else if (pc.transport.sentMessageCounter === 2) {
            assert.match(msg, /You/);
            done();
          }
        };
        uut.execute(pc);
      });
    });
  });
});

describe('AttackFactory', () => {
  describe('when generating an action', () => {
    let factory;
    beforeEach(() => {
      factory = new AttackFactory();
    });

    it('handles an empty token list', () => {
      const result = factory.generate([]);
      assert(!result);
    });

    it('handles a person', () => {
      const result = factory.generate(['the', 'rat']);
      assert(result);
      assert(result.target === 'the rat');
    });
  });
});
