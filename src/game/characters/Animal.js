//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Character from './Character.js';
import { getPreceedingArticle } from '../../lib/stringHelpers.js';

/**
 * @module game/characters/Animal
 */

/**
 * A creature of some sort that behaves in a particular way
 *
 * Vague, to be sure. But the general idea is that the logic for how animals
 * behave is largely consistent, and that most of our logic can be handled by
 * the type of animals being constructed.
 *
 * Sub-classes, maybe.
 */
class Animal extends Character {

  /**
   * Make a new animal
   *
   * @param {CharacterModel} model - The model for the character
   * @param {World}          world - The world the character inhabits
   */
  constructor(model, world) {
    super(model, world);
  }

  /**
   * Provide a short description of the animal
   *
   * @returns {String}
   */
  toShortText() {
    const article = getPreceedingArticle(this.name);
    return `${article}${article.length > 0 ? ' ' : ''}${this.name}`;
  }
}

export default Animal;
