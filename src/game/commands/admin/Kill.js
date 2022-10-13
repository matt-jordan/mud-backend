//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { ErrorAction } from '../default/Error.js';

/**
 * @module game/commands/admin/Kill
 */

/**
 * An admin command that will auto-death just about anything
 */
class KillAction {

  /**
   * Create a new kill action
   *
   * @param {String} target - The target of the action
   */
  constructor(target) {
    this.target = target;
  }

  /**
   * Execute the command
   *
   * @param {Character} character - The character who initiated the command
   */
  async execute(character) {
    if (!character.room) {
      character.sendImmediate('You are floating in a void.');
      return;
    }

    const room = character.room;
    const target = room.characters.findItem(this.target);
    if (!target) {
      character.sendImmediate(`You do not see '${this.target}' here`);
      return;
    }

    if (target === character) {
      character.sendImmediate('You cannot kill yourself');
      return;
    }

    // NUKE
    character.sendImmediate(`You deliver judgement upon ${target.toShortText()}.`);
    character.room.sendImmediate([character], `${character.toShortText()} delivers judgement upon ${target.toShortText()}.`);
    await target.applyDamage(1000000);
  }

}

/**
 * Factory for generating {KillAction} objects
 */
class KillFactory {

  /**
   * Name of the command that maps player input to the action
   */
  static get name() {
    return 'admin-kill';
  }

  /**
   * Default constructor
   */
  constructor() {
  }

  /**
   * Generate a {KillAction} object
   *
   * @param {List} tokens - The list of tokens
   *
   * @returns {KillAction}
   */
  generate(tokens) {
    if (!tokens || tokens.length === 0) {
      return new ErrorAction({ message: 'Who do you want to kill?' });
    }
    return new KillAction(tokens.join(' '));
  }
}

export {
  KillAction,
  KillFactory
};