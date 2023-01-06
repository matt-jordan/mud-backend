//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import PrayerOfFire from '../../../../src/game/effects/priest/PrayerOfFire.js';

describe('PrayerOfFire', () => {
  let character;

  beforeEach(() => {
    character = {
      id: 'character',
      attributes: {
        manapoints: {
          current: 50,
          base: 200,
        },
        energypoints: {
          current: 1,
          base: 100,
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
        const uut = new PrayerOfFire({ character, chantSkill: 1, prayerSkill: 1 });
        uut.onTick();
        assert(uut.tick === 0);
        assert(character.attributes.energypoints.current === 1);
      });
    });

    [[1, 1, 42, 7], [10, 10, 43, 7], [20, 20, 44, 8], [30, 30, 45, 8], [50, 50, 47, 10], [100, 100, 49, 38]].forEach((tuple) => {
      describe(`chant: ${tuple[0]}, mana: ${tuple[1]}`, () => {
        it('calculates the right result', () => {
          const uut = new PrayerOfFire({ character, chantSkill: tuple[0], prayerSkill: tuple[1] });
          uut.onTick();
          assert(character.attributes.manapoints.current === tuple[2], character.attributes.manapoints.current);
          assert(character.attributes.energypoints.current === tuple[3], character.attributes.energypoints.current);
        });
      });
    });
  });

});