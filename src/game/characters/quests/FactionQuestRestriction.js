//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

/**
 * @module game/characters/quests/FactionQuestRestriction
 */

/**
 * Exercise restrictions for quests based on faction
 */
class FactionQuestRestriction {

  /**
   * Create a new faction restriction
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Perform a check on the character
   *
   * @param {Character} character - The character to check
   */
  check(character) {
    const { faction, minFaction = 0 } = this.model.data;

    const factionScore = character.factions.factionScore(faction);
    if (factionScore < 0) {
      return false;
    }

    return factionScore >= minFaction;
  }

}

export default FactionQuestRestriction;