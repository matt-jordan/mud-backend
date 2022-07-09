//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { ErrorAction } from '../default/Error.js';

/**
 * @module game/commands/social/Say
 */

/**
 * Command action for saying something
 */
class SayAction {

  /**
   * Create a new SayAction
   *
   * @param {String} message - message to send to the room
   */
  constructor(message) {
    this.message = message;
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

    character.room.sendImmediate([character], {
      language: character.language || 'common',
      text: this.message
    });
  }

}

/**
 * Factory that generates SayAction objects
 */
class SayFactory {

  /**
   * The mapping of this factory to the player command
   *
   * @return {String}
   */
  static get name() {
    return 'say';
  }

  /**
   * Create a new factory
   */
  constructor() {
  }

  /**
   * Generate a SayAction from the provided player input
   *
   * @param {Array.<String>} tokens - The text the player provided
   *
   * @return {SayAction} On success, the action to execute, or null
   */
  generate(tokens) {
    if (!tokens || tokens.length === 0) {
      return new ErrorAction({ command: 'Say', message: 'What do you want to say?' });
    }
    return new SayAction(tokens);
  }

}

export {
  SayAction,
  SayFactory,
};
