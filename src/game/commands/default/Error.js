//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

/**
 * @module game/commands/default/Error
 */

/**
 * Command action for errors that occur
 */
class ErrorAction {

  /**
   * Create a new Error
   *
   * @param {String} command    - The command that the player tried to execute
   * @param {String} parameters - The rest of the data
   */
  constructor(command, parameters) {
    this.command = command;
    this.parameters = parameters;
  }

  /**
   * Execute the command on the player character
   *
   * @param {Character} character - The player to execute on
   */
  execute(character) {
    character.sendImmediate(`You don't know how to '${this.command}'`);
  }

}

/**
 * Factory that generates DropItemAction objects
 */
class ErrorFactory {

  /**
   * The mapping of this factory to the player command
   */
  static get name() {
    return '__error__';
  }

  /**
   * Create a new factory
   */
  constructor() {
  }

  /**
   * Generate the DropItemAction from player input
   */
  generate(command, tokens = []) {
    return new ErrorAction(command, tokens.join(' '));
  }
}

export {
  ErrorAction,
  ErrorFactory,
};