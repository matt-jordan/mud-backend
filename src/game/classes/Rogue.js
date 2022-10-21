//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import BaseClass from './BaseClass.js';

/**
 * @module game/classes/Priest
 */

class Rogue extends BaseClass {

  /**
   * Create a new fighter class
   */
  constructor(character) {
    super(character);

    this.hitDice = 8;
    this.energyDice = 8;
    this.manaDice = 0;

    this.setLevel();
  }

  /**
   * The underlying class type
   */
  get characterType() {
    return 'rogue';
  }

  /**
   * A character's mana points bonus
   *
   * @returns {Number}
   */
  get manapointBonus() {
    return 0;
  }

  /**
   * Set the level properties on the character
   */
  setLevel() {
    switch(this.level) {
    case 1:
      if (!this.character.skills.has('attack')) {
        this.character.skills.set('attack', 1);
      }
      if (!this.character.skills.has('piercing')) {
        this.character.skills.set('piercing', 1);
      }
      if (!this.character.skills.has('backstab')) {
        this.character.skills.set('backstab', 1);
      }
      if (!this.character.skills.has('defense')) {
        this.character.skills.set('defense', 1);
      }
      if (!this.character.skills.has('armor')) {
        this.character.skills.set('armor', 1);
      }
      break;
    case 2:
      break;
    default:
      break;
    }
  }

  /**
   * Convert this class to JSON
   *
   * @return {Object}
   */
  toJson() {
    const base = super.toJson();
    return {
      ...base,
      type: this.characterType,
    };
  }
}

export default Rogue;