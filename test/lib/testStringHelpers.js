//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { capitalize, getPreceedingArticle } from '../../src/lib/stringHelpers.js';

describe('capitalize', () => {
  it('handles a number', () => {
    const result = capitalize('3rat');
    assert(result === '');
  });

  it('handles an empty string', () => {
    const result = capitalize('');
    assert(result === '');
  });

  it('handles capital letters', () => {
    const result = capitalize('A');
    assert(result === 'A');
  });

  it('handles words', () => {
    const result = capitalize('iguana');
    assert(result === 'Iguana');
  });
});

describe('getPreceedingArticle', () => {
  it('handles a number', () => {
    const result = getPreceedingArticle('3rat');
    assert(result === '');
  });

  it('handles an empty string', () => {
    const result = getPreceedingArticle('');
    assert(result === '');
  });

  it('handles proper nouns', () => {
    const result = getPreceedingArticle('Bob');
    assert(result === '');
  });

  it('handles vowels', () => {
    const result = getPreceedingArticle('iguana');
    assert(result === 'an');
  });

  it('handles consonants', () => {
    const result = getPreceedingArticle('rat');
    assert(result === 'a');
  });
});