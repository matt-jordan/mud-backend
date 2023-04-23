//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Character from './Character.js';

/**
 * @module game/characters/Human
 */

/**
 * Class representing a generic human
 */
class Human extends Character {

  /**
   * Create a new human character
   *
   * @param {CharacterModel} model - The model for the human character
   * @param {World}          world - The one and only world
   */
  constructor(model, world) {
    super(model, world);

    // All humans are proficient in common
    this.skills.set('common', 100);
  }

}

export default Human;

