//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

/**
 * @module game/commands/default/Look
 */

/**
 * Command action for looking at things
 */
class LookAction {

  /**
   * Create a new LookAction
   *
   * @param {Object} [options] - Configure how look will execute
   * @param {string} [options.direction] - The direction to look in
   * @param {Object} [options.target] - The target object or thing to look at
   */
  constructor(options = {}) {
    this.direction = options.direction;
    this.target = options.target;
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
    const room = character.room;

    if (!this.direction && !this.target) {
      character.sendImmediate(room.toRoomDetailsMessage(character.id));
      return;
    }

    if (this.direction) {
      if (!(this.direction in room.exits)) {
        character.sendImmediate('There is nothing in that direction.');
        return;
      }
      const exit = room.exits[this.direction];
      const destination = character.world.findRoomById(exit.destinationId);
      if (!destination) {
        character.sendImmediate('There is nothing in that direction.');
        return;
      }
      character.sendImmediate(await destination.toShortText());
      return;
    }

    if (this.target) {
      if (this.target === character.name) {
        character.sendImmediate('You do not have a mirror');
        return;
      }

      let item = character.room.inanimates.findItem(this.target);
      if (!item) {
        item = character.room.characters.find(c => c.name === this.target);
        if (!item) {
          character.sendImmediate(`You do not see a ${this.target} here.`);
          return;
        }
        character.room.sendImmediate([character], `${character.name} looks at ${this.target}`);
      }
      character.sendImmediate(item.toLongText());
      return;
    }
  }
}

/**
 * Factory that generates LookAction objects
 */
class LookFactory {

  /**
   * The mapping of this factory to the player command
   *
   * @return {String}
   */
  static get name() {
    return 'look';
  }

  /**
   * Create a new factory
   */
  constructor() {
    this.options = [ [
      'north',
      'south',
      'west',
      'east',
      'up',
      'down',
      'northwest',
      'northeast',
      'southwest',
      'southeast',
    ] ];
  }

  /**
   * Generate a LookAction from the provided player input
   *
   * @param {Array.<String>} tokens - The text the player provided
   *
   * @return {LookAction} On success, the action to execute, or null
   */
  generate(tokens) {
    if (tokens.length === 0) {
      return new LookAction();
    }
    if (tokens.length === 1) {
      const direction = this.options[0].find((option) => option === tokens[0]);
      if (!direction) {
        // TODO: Return an Error message action
        return null;
      }
      return new LookAction({ direction });
    } else if (tokens.length >= 2 && tokens[0] === 'at') {
      return new LookAction({ target: tokens.slice(1).join(' ') });
    }
    // TODO: return an Error message action
    return null;
  }

}

export {
  LookAction,
  LookFactory,
};
