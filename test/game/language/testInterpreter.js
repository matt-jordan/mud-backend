//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { interpretLanguage, parseIntoSyllables } from '../../../src/game/language/interpreter.js';

describe('parseIntoSyllables', () => {
  Object.entries({
    'animal': ['a', 'ni', 'mal'],
    'an': ['an'],
    'the': ['the'],
    'why': ['why'],
    'ready': ['rea', 'dy'],
    'foot': ['foot'],
    'yellow': ['yel', 'low'],
    'sympathy': ['sym', 'pat', 'hy'],
    'wherewithal': ['whe', 're', 'wit', 'hal'],
  }).forEach((pair) => {
    describe(`${pair[0]}`, () => {
      it('matches', () => {
        const syllables = parseIntoSyllables(pair[0]);
        assert(syllables.length !== 0);
        assert(syllables.length === pair[1].length);
        for (let i = 0; i < syllables.length; i++) {
          assert(syllables[i] === pair[1][i]);
        }
      });
    });
  });
});

describe('interpretLanguage', () => {

  const testString = 'Another phrase. The quick brown fox jumped over the lazy dog.';

  const testCharacter = {
    language: 'unknown',
  };

  describe('when it does not know the language', () => {
    it('returns something other than the original text', () => {
      const result = interpretLanguage('__made_up_language__', testCharacter, testString);
      assert(result);
      assert(result !== testString);
    });
  });

  describe('when the character does not have the language', () => {
    beforeEach(() => {
      testCharacter.getSkill = () => {
        return 0;
      };
    });

    it('converts it to something other than original text', () => {
      const result = interpretLanguage('goblin', testCharacter, testString);
      assert(result);
      assert(result !== testString);
    });
  });

  describe('when the character has some notion of the language', () => {
    beforeEach(() => {
      testCharacter.getSkill = () => {
        return 80;
      };
    });

    it('figures out some of the words', () => {
      const result = interpretLanguage('imperia', testCharacter, testString);
      let match = false;
      const tokens = testString.split(' ');
      const resultTokens = result.split(' ');
      console.log(result);
      for (let i = 0; i < tokens.length; i += 1) {
        if (tokens[i] === resultTokens[i]) {
          match = true;
        }
      }
      assert(match);
    });
  });

});
