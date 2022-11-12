//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
/**
 * @module lib/stringHelpers
 */
/**
 * Capitalize the first letter in a string and return the whole string
 *
 * @param {String} text - The word or phrase to capitalize
 *
 * @returns {String}
 */
function capitalize(text) {
    if (text.length === 0) {
        return '';
    }
    const character = text.charAt(0);
    if (!isNaN(character)) {
        return '';
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
}
/**
 * Determine if a word should be preceeded by 'A' or 'An'
 *
 * If the word is a proper noun or not a letter, an empty string is returned.
 *
 * @param {String} text - The word or phrase to test
 *
 * @returns {String}
 */
function getPreceedingArticle(text) {
    if (text.length === 0) {
        return '';
    }
    const character = text.charAt(0);
    if (!isNaN(character)) {
        return '';
    }
    // Proper nouns don't get an article
    if (character === character.toUpperCase()) {
        return '';
    }
    if ('aeiou'.includes(character)) {
        return 'an';
    }
    return 'a';
}
export { capitalize, getPreceedingArticle, };
