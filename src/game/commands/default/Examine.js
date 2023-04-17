//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { ErrorAction } from './Error.js';

/**
 * @module game/commands/default/Examine
 */

/**
 * Command action for examining at things
 */
class ExamineAction {

  /**
   * Create a new ExamineAction
   *
   * @param {String} target - The target object or thing to examine
   */
  constructor(target) {
    this.target = target;
  }

  /**
   * Execute the action on the character
   *
   * @param {Character} character - The character to execute on
   */
  async execute(character) {
    if (!character.room) {
      character.sendImmediate('You are floating in a void');
      return;
    }

    if (!this.target) {
      character.sendImmediate('What do you want to examine?');
      return;
    }

    let item = character.room.inanimates.findItem(this.target);
    if (!item) {
      item = character.room.characters.findItem(this.target);
    }
    if (!item) {
      item = character.inanimates.findItem(this.target);
    }
    if (!item) {
      item = character.room.getDoor(this.target);
    }

    if (!item) {
      character.sendImmediate(`You do not see a ${this.target} here.`);
      return;
    }

    if (item === character) {
      character.sendImmediate('You do not have a mirror.');
      return;
    }

    let retVal;
    retVal = item.toLongText(character);

    character.sendImmediate(retVal);
    character.room.sendImmediate([character], `${character.name} examines ${item.toShortText()}`);
  }
}

/**
 * Factory that generates ExamineAction objects
 */
class ExamineFactory {

  /**
   * The mapping of this factory to the player command
   *
   * @return {String}
   */
  static get name() {
    return 'examine';
  }

  /**
   * Create a new factory
   */
  constructor() {
  }

  /**
   * Generate a ExamineAction from the provided player input
   *
   * @param {Array.<String>} tokens - The text the player provided
   *
   * @return {ExamineAction} On success, the action to execute, or null
   */
  generate(tokens) {
    if (!tokens || tokens.length === 0) {
      return new ErrorAction({ message: 'What do you want to examine?'});
    }

    return new ExamineAction(tokens.join(' '));
  }

}

export {
  ExamineAction,
  ExamineFactory,
};
