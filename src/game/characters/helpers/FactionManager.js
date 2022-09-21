//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import FactionModel from '../../../db/models/FactionModel.js';
import asyncForEach from '../../../lib/asyncForEach.js';
import log from '../../../lib/log.js';

/**
 * @module game/characters/helpers/FactionManager
 */

/**
 * Manages the state of a faction for a character
 */
class FactionManager {

  /**
   * Create a faction manager for a character
   *
   * @param {Character} character - The character to manage factions for
   */
  constructor(character) {
    this.character = character;
    this.factions = {};
  }

  /**
   * Adjust the faction standing for this character
   *
   * @param {String} name  - The name of the faction to adjust
   * @param {Number} score - The value to adjust the faction standing by
   */
  async adjustFaction(name, score) {
    let modifier = score + this.character.getAttributeModifier('charisma');
    if (score < 0 && modifier >= 0) {
      modifier = -1;
    } else if (score > 0 && modifier <= 0) {
      modifier = 1;
    }

    return this._adjustFaction(name, modifier);
  }

  /**
   * Internal function used for adjusting faction
   * @internal
   * @param {String} name  - The name of the faction to adjust
   * @param {Number} score - The value to adjust the faction standing by
   */
  async _adjustFaction(name, score) {
    if (!(name in this.factions)) {
      const factionModel = await FactionModel.findOne({ name });
      if (!factionModel) {
        log.warn({ characterId: this.character.id }, `Unable to find faction ${name}`);
        return;
      }
      this.factions[name] = {
        score: factionModel.startingValue,
        model: factionModel,
      };
    }

    if (this.factions[name].score + score > 100) {
      this.factions[name].score = 100;
      log.debug({
        characterId: this.character.id,
        factionName: name,
        factionScore: this.factions[name].score,
        score,
      }, 'Setting score to 100; it cannot get better');
    } else if (this.factions[name].score + score < 0) {
      this.factions[name].score = 0;
      log.debug({
        characterId: this.character.id,
        factionName: name,
        factionScore: this.factions[name].score,
        score,
      }, 'Setting score to 0; it cannot get worse');
    } else {
      this.factions[name].score += score;
      log.debug({
        characterId: this.character.id,
        factionName: name,
        factionScore: this.factions[name].score,
        score,
      }, 'Adjusting faction score');
    }
  }

  /**
   * Get all the faction scores for this character
   *
   * @returns {Array} A list of Objects of faction names/scores
   */
  factionScores() {
    return Object.values(this.factions).map((value) => {
      return {
        name: value.model.name,
        score: value.score,
        positiveModifier: value.model.positiveModifier,
        negativeModifier: value.model.negativeModifier,
      };
    });
  }

  /**
   * Handle this character's faction adjustments as a result of killing a character
   *
   * @param {Character} deadCharacter - The character who we just killed
   */
  async processKill(deadCharacter) {
    await asyncForEach(deadCharacter.factions.factionScores(), async (faction) => {
      const { name, score, negativeModifier, positiveModifier } = faction;
      const charismaBonus = this.character.getAttributeModifier('charisma');

      // Three modifiers (so far):
      //  Convert their faction status to a value between 4 (0) and -6 (100)
      //  Add the charisma bonus -4 (2) to 4 (18)
      //  Add the faction's base modifier - if the character was poorly aligned
      //    add the positive modifier; if the character was well aligned negative
      //    modifier
      let modifier = (Math.ceil((score - 40) / 10) * -1)
        + charismaBonus
        + (score > 40 ? negativeModifier * -1 : positiveModifier);

      // No matter what, make sure we modify it in some way
      if (modifier <= 0 && score < 40) {
        modifier = 1;
      } else if (modifier >=0 && score > 40) {
        modifier = -1;
      }
      await this._adjustFaction(name, modifier);
    });
  }


}

export default FactionManager;