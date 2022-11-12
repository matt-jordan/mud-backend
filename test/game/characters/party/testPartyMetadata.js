//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import PartyMetadata from '../../../../build/game/characters/party/PartyMetadata.js';
import PartyMetadataError from '../../../../build/game/characters/party/PartyMetadataError.js';

describe('PartyMetadata', () => {

  describe('set', () => {
    it('throws an exception when the property type is not known', () => {
      const uut = new PartyMetadata();
      let thrown = false;
      try {
        uut.set({}, { property: 'foo', value: 'wat' });
      } catch (err) {
        assert(err instanceof PartyMetadataError);
        thrown = true;
      }
      assert(thrown);
    });
  });

});