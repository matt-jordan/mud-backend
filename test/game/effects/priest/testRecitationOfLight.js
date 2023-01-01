//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import RecitationOfLight from '../../../../src/game/effects/priest/RecitationOfLight.js';

describe('RecitationOfLight', () => {
  let character;

  beforeEach(() => {
    character = {
      id: 'character',
      attributes: {
        hitpoints: {
          current: 10,
          base: 100,
        },
        manapoints: {
          current: 50,
          base: 200,
        },
      },
      effects: [],
      sendImmediate: () => {},
      toCharacterDetailsMessage: () => {},
    };
  });

  describe('onInitialPush', () => {
    it('queues up a light effect', () => {
      const uut = new RecitationOfLight({ character, chantSkill: 1, prayerSkill: 1 });
      uut.onInitialPush();
      assert(character.effects.length === 1);
      assert(character.effects[0].source.includes(RecitationOfLight.name));
    });
  });

  describe('onExpire', () => {
    it('expires it off the character', () => {
      const uut = new RecitationOfLight({ character, chantSkill: 1, prayerSkill: 1 });
      uut.onInitialPush();
      assert(character.effects.length === 1);
      uut.onExpire();
      assert(character.effects.length === 0);
    });

    it('expires the correct one when there are two effects', () => {
      const uut1 = new RecitationOfLight({ character, chantSkill: 1, prayerSkill: 1 });
      const uut2 = new RecitationOfLight({ character, chantSkill: 1, prayerSkill: 1 });
      uut1.onInitialPush();
      uut2.onInitialPush();
      assert(character.effects.length === 2);
      uut1.onExpire();
      assert(character.effects.length === 1);
      uut2.onExpire();
      assert(character.effects.length === 0);
    });
  });

});