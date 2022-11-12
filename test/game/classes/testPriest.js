//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Priest from '../../../build/game/classes/Priest.js';

describe('Priest', () => {

  const fakeCharacter = {
    skills: new Map(),
    sendImmediate: () => {},
    commandSets: [],
  };

  describe('setLevel', () => {
    describe('level 1', () => {
      it('sets the appropriate attributes', () => {
        const uut = new Priest(fakeCharacter); // this happens in the constructor
        assert(uut);
        assert(fakeCharacter.skills.get('attack') === 1);
        assert(fakeCharacter.skills.get('defense') === 1);
        assert(fakeCharacter.skills.get('bludgeoning') === 1);
        assert(fakeCharacter.skills.get('shields') === 1);
        assert(fakeCharacter.skills.get('armor') === 1);
      });
    });
  });
});
