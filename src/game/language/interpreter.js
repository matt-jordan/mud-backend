//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import randomInteger from '../../lib/randomInteger.js';

import Imperia from './Imperia.js';

const languages = {};
languages[Imperia.name] = Imperia.interpret;

const punctuation = ['.', ';', ',', '!', '?'];
const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
const consanants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p',
  'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z', 'ch', 'ck', 'gn', '\'', ' '];

// Thank you https://stackoverflow.com/questions/49403285/splitting-word-into-syllables-in-javascript
// This isn't perfect, but it's good enough for our purposes
const syllableRegex = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi;
const parseIntoSyllables = (word) => {
  return word.match(syllableRegex);
};

/**
 * An interpreter when we have no idea what the language is, in which case, MANGLE
 */
const defaultInterpreter = (tokens) => {
  if (!tokens || tokens.length === 0) {
    return '';
  }

  let words = tokens;
  if (typeof tokens === 'string' || tokens instanceof String) {
    words = tokens.split(' ');
  }
  const result = [];

  words.forEach((word) => {
    let resultWord = '';
    const syllables = parseIntoSyllables(word);
    syllables.forEach((syllable) => {
      for (let i = 0; i < syllable.length; i++) {
        if (punctuation.includes(syllable.charAt(i))) {
          resultWord += syllable.charAt(i);
        } else if (vowels.includes(syllable.charAt(i))) {
          resultWord += vowels[randomInteger(0, vowels.length - 1)];
        } else {
          resultWord += consanants[randomInteger(0, consanants.length - 1)];
        }
      }
    });
    result.push(resultWord);
  });

  return result.join(' ');
};

const interpretLanguage = (language, character, message) => {
  if (!(language in languages)) {
    return defaultInterpreter(message);
  }

  const skill = character.getSkill(language);
  if (skill === 100) {
    return message;
  }

  return languages[language](message, skill);
};

export {
  interpretLanguage,
  parseIntoSyllables,
};