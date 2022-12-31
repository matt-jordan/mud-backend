//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import PrayerOfHealing from '../../../../src/game/effects/priest/PrayerOfHealing.js';

describe('PrayerOfHealing', () => {
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
      sendImmediate: () => {},
      toCharacterDetailsMessage: () => {},
    };
  });

  describe('onTick', () => {
    describe('when you run out of mana', () => {
      beforeEach(() => {
        character.attributes.manapoints.current = 0;
      });

      it('sets the tick to 0', () => {
        const uut = new PrayerOfHealing({ character, chantSkill: 1, prayerSkill: 1 });
        uut.onTick();
        assert(uut.tick === 0);
        assert(character.attributes.hitpoints.current === 10);
      });
    });

    [[1, 1, 44, 12], [10, 10, 45, 12], [20, 20, 46, 13], [30, 30, 47, 13], [50, 50, 49, 15], [100, 100, 49, 43]].forEach((tuple) => {
      describe(`chant: ${tuple[0]}, mana: ${tuple[1]}`, () => {
        it('calculates the right result', () => {
          const uut = new PrayerOfHealing({ character, chantSkill: tuple[0], prayerSkill: tuple[1] });
          uut.onTick();
          assert(character.attributes.manapoints.current === tuple[2], character.attributes.manapoints.current);
          assert(character.attributes.hitpoints.current === tuple[3], character.attributes.hitpoints.current);
        });
      });
    });
  });

});