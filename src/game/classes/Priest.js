//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import BaseClass from './BaseClass.js';
import { PriestCommandSet } from '../commands/CommandSet.js';

/**
 * @module game/classes/Priest
 */

class Priest extends BaseClass {

  /**
   * Create a new fighter class
   */
  constructor(character) {
    super(character);

    character.commandSets.push(PriestCommandSet);

    this.hitDice = 8;
    this.energyDice = 8;
    this.manaDice = 4;

    this.setLevel();
  }

  /**
   * The underlying class type
   */
  get characterType() {
    return 'priest';
  }

  /**
   * A character's mana points bonus
   *
   * @returns {Number}
   */
  get manapointBonus() {
    return this.character.getAttributeModifier('wisdom');
  }

  /**
   * Set the level properties on the character
   */
  setLevel() {
    super.setLevel();

    // prayer: effects others more
    // mantra: effects enemies
    // recitation: effects you more
    // canticle: equal to everyone
    switch(this.level) {
    case 1:
      super.setBaseSkill('attack');
      super.setBaseSkill('bludgeoning');
      super.setBaseSkill('defense');
      super.setBaseSkill('shields');
      super.setBaseSkill('armor');
      break;
    case 2:
      super.setBaseSkill('chant');
      super.setBaseSkill('prayer of healing'); // water
      break;
    case 3:
      super.setBaseSkill('recitation of light'); // light
      super.setBaseSkill('prayer of vitality'); //fire
      break;
    case 4:
      super.setBaseSkill('canticle of night'); // dark
      break;
    case 5:
      super.setBaseSkill('recitation of the aegis'); //earth
      break;
    case 6:
      super.setBaseSkill('prayer of quickness'); // wind
      break;
    case 7:
      super.setBaseSkill('recitation of wrath'); // beast
      break;
    case 8:
      super.setBaseSkill('mantra of terror'); // spirit
      break;
    case 9:
      super.setBaseSkill('prayer of lucidity') // mana regen; water + spirit
      super.setBaseSkill('mantra of the unsullied'); // undead purge; light + fire
      break;
    case 10:
      super.setBaseSkill('canticle of the dark wind'); // evasion and speed; dark + wind
      super.setBaseSkill('recitation of the implacable') // physical improvements + defense; beast + earth
      break;
    default:
      break;
    }
  }

  /**
   * Max out the skills of a character based on their level
   */
  setMaxSkills() {
    [
      'attack', 'bludgeoning', 'defense', 'shields', 'armor', 'chant', 'prayer of healing',
      'recitation of light', 'prayer of vitality', 'canticle of night', 'recitation of the aegis',
      'prayer of quickness', 'recitation of wrath', 'mantra of terror', 'prayer of lucidity',
      'mantra of the unsullied', 'canticle of the dark wind', 'recitation of the implacable'
    ].forEach((skill) => {
      if (this.character.skills.has(skill)) {
        this.character.skills.set(skill, this.level * 5);
      }
    });
  }

  /**
   * Add experience to the character class
   *
   * @param {Number} encounterLevel - The level of the encounter completed
   *
   * @returns {Boolean} True if we gained a level, false otherwise
   */
  addExperience(encounterLevel) {
    const result = super.addExperience(encounterLevel);
    if (!result) {
      return result;
    }
    this.character.sendImmediate(this.character.toCharacterDetailsMessage());
    return result;
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

export default Priest;