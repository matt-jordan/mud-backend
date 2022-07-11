//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { ErrorAction } from './Error.js';
import Character from '../../characters/Character.js';

/**
 * @module game/commands/default/Attack
 */

/**
 * An action that attacks another character
 */
class AttackAction {

  /**
   * Create a new attack action
   *
   * @param {Object} params
   * @param {String} params.target - The target to attack
   */
  constructor(params) {
    this.target = params.target;
  }

  /**
   * Execute the action on the character
   *
   * @param {Character} character - The character who is attacking
   */
  execute(character) {
    if (!character.room) {
      character.sendImmediate('You are floating in a void.');
      return;
    }

    const room = character.room;
    const target = room.characters.find(c => c.name === this.target);
    if (!target) {
      character.sendImmediate(`You do not see ${this.target} here`);
      return;
    }

    if (target === character) {
      character.sendImmediate('You cannot attack yourself');
      return;
    }

    if (character.currentState === Character.STATE.RESTING) {
      character.sendImmediate('You cannot attack, you are resting.');
      return;
    }

    // We don't want to create a new combat pair to the same defender, but we
    // should allow switching combats. For now, let's just lock them in.
    const existingCombat = room.combatManager.getCombat(character);
    if (existingCombat && target === existingCombat.defender) {
      character.sendImmediate(`You are already attacking ${existingCombat.defender.toShortText()}!`);
      return;
    }

    character.sendImmediate(`You attack ${target.toShortText()}!`);

    const combat = room.combatManager.addCombat(character, target);
    room.combatManager.addCombat(target, character);
    combat.processRound();
  }
}

/**
 * Factory for generating attack commands
 */
class AttackFactory {

  /**
   * The mapping of this factory to the player command
   */
  static get name() {
    return 'attack';
  }

  /**
   * Create a new attack factory
   */
  constructor() {
  }

  /**
   * Generate a new AttackAction
   *
   * @param {Array.<String>} tokens - The text the player provided
   *
   * @return {AttackAction} On success the action to execute, or null
   */
  generate(tokens) {
    if (!tokens || tokens.length < 1) {
      return new ErrorAction({ message: 'Who do you want to attack?' });
    }

    return new AttackAction({ target: tokens.join(' ') });
  }

}

export {
  AttackAction,
  AttackFactory,
};
