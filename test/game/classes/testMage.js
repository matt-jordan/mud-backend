//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Mage from '../../../build/game/classes/Mage.js';

describe('Mage', () => {

  const fakeCharacter = {
    skills: new Map(),
    sendImmediate: () => {},
  };

  describe('setLevel', () => {
    describe('level 1', () => {
      it('sets the appropriate attributes', () => {
        const uut = new Mage(fakeCharacter); // this happens in the constructor
        assert(uut);
        assert(fakeCharacter.skills.get('piercing') === 1);
      });
    });
  });
});
