//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

class LookAction {
  constructor(options = {}) {
    this.direction = options.direction;
    this.object = options.object;
  }

  async execute(character) {
    if (!character.room) {
      character.sendImmediate('You are floating in a void');
      return;
    }
    const room = character.room;

    if (!this.direction && !this.object) {
      character.sendImmediate(room.toText());
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

    /*
    let foundObject;
    let searchTerm;
    let index = -1;
    if (!this.object.includes('.')) {
      searchTerm = this.object;
    } else {
      const tokens = this.object.split('.');
      index = parseInt(tokens[0], 10);
      searchTerm = tokens[1].trim();
    }

    const things = room.characters.concat(room.inanimates);
    const objects = things.filter(i => i.name === searchTerm);
    if (objects.length === 0) {
      character.sendImmediate(`${this.object} is not here.`);
    } else if (objects.length > 1) {
      if (index < 0) {
        character.sendImmediate(`Which ${this.object} do you want?`);
      } else if (index > objects.length - 1) {
        character.sendImmediate(`There are not ${index} ${searchTerm} here.`);
      } else {
        foundObject = objects[index];
      }
    } else {
      foundObject = objects[0];
    }

    if (foundObject) {
      character.sendImmediate(`${foundObject.toShortText()}`);
    }
    */
  }
}

class LookFactory {
  static get name() {
    return 'Look';
  }

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
    } else if (tokens.length > 2 && tokens[0] === 'at') {
      return new LookAction({ object: tokens.slice(1).join(' ') });
    }
    // TODO: return an Error message action
    return null;
  }

}

export {
  LookAction,
  LookFactory,
};
