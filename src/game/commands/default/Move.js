
import log from '../../../lib/log.js';

class MoveAction {
  constructor(options) {
    this.direction = options.direction;
  }

  async execute(character) {
    if (!character.room) {
      character.sendImmediate('You are floating in a void');
      return;
    }

    const startRoom = character.room;
    if (!(this.direction in startRoom.exits)) {
      character.sendImmediate('There is nothing in that direction.');
      return;
    }

    const exit = startRoom.exits[this.direction];
    // TODO: Handle closed doors here
    if (!exit.destinationId) {
      character.sendImmediate('You bounce off an immovable force.');
      return;
    }

    const destinationRoom = character.world.findRoomById(exit.destinationId);
    if (!destinationRoom) {
      log.warn({
        action: this,
        characterId: character.id,
        roomId: exit.destinationId,
      }, 'Destination room not found in area');
      character.sendImmediate('You bounce off an immovable force.');
      return;
    }

    log.debug({ characterId: character.id, roomId: destinationRoom.id },
      'Moving character to room');
    character.moveToRoom(destinationRoom);
  }
}

class MoveFactory {
  static get name() {
    return 'Move';
  }

  constructor() {
    this.options = [
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
    ];
  }

  generate(tokens) {
    if (tokens.length !== 1) {
      return null;
    }

    const direction = this.options.find((option) => option === tokens[0]);
    if (!direction) {
      return null;
    }

    return new MoveAction({ direction });
  }
}

export {
  MoveAction,
  MoveFactory,
};
