//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import BaseClass from '../../../src/game/classes/BaseClass.js';

describe('BaseClass', () => {

  const fakeCharacter = {
    sendImmediate: () => {},
  };

  describe('addExperience', () => {
    describe('when the delta is more than -2 levels', () => {
      it('gives the right experience', () => {
        const uut = new BaseClass(fakeCharacter);
        uut.level = 5;
        assert(uut.addExperience(2) === false);
        assert(uut.experience === Math.floor(BaseClass.encounterLevelToExp[2] / 4));
      });
    });

    describe('when the delta is -2 levels', () => {
      it('gives the right experience', () => {
        const uut = new BaseClass(fakeCharacter);
        uut.level = 5;
        assert(uut.addExperience(3) === false);
        assert(uut.experience === Math.floor(BaseClass.encounterLevelToExp[3] / 4));
      });
    });

    describe('when the delta is -1 level', () => {
      it('gives the right experience', () => {
        const uut = new BaseClass(fakeCharacter);
        uut.level = 5;
        assert(uut.addExperience(4) === false);
        assert(uut.experience === Math.floor(BaseClass.encounterLevelToExp[4] / 2));
      });
    });

    describe('when the delta is 0', () => {
      it('gives the right experience', () => {
        const uut = new BaseClass(fakeCharacter);
        uut.level = 5;
        assert(uut.addExperience(5) === false);
        assert(uut.experience === BaseClass.encounterLevelToExp[5]);
      });
    });

    describe('when the delta is +1 level', () => {
      it('gives the right experience', () => {
        const uut = new BaseClass(fakeCharacter);
        uut.level = 5;
        assert(uut.addExperience(6) === false);
        assert(uut.experience === BaseClass.encounterLevelToExp[6] * 2);
      });
    });

    describe('when the delta is +2 levels', () => {
      it('gives the right experience', () => {
        const uut = new BaseClass(fakeCharacter);
        uut.level = 5;
        assert(uut.addExperience(7) === false);
        assert(uut.experience === BaseClass.encounterLevelToExp[7] * 4);
      });
    });

    describe('when the delta is more than +2 levels', () => {
      it('gives the right experience', () => {
        const uut = new BaseClass(fakeCharacter);
        uut.level = 5;
        assert(uut.addExperience(8) === false);
        assert(uut.experience === BaseClass.encounterLevelToExp[8] * 4);
      });
    });

    describe('when the character gains a level', () => {
      it('returns true', () => {
        const uut = new BaseClass(fakeCharacter);
        uut.level = 1;
        uut.experience = 999;
        assert(uut.addExperience(2) === true);
        assert(uut.level === 2);
      });
    });
  });
});
