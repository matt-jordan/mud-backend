//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import randomInteger from '../../../lib/randomInteger.js';
import log from '../../../lib/log.js';

const DEFAULT_MOVE_CHANCE = 20;

/**
 * @module game/characters/ai/RandomWanderer
 */

/**
 * A class that implements an AI that causes a character to wander randomly
 */
class RandomWanderer {

  constructor(character) {
    this.character = character;
    this.moveChance = DEFAULT_MOVE_CHANCE;
  }

  get aiType() {
    return 'move';
  }

  get name() {
    return 'RandomWanderer';
  }

  async onTick() {
    const chance = randomInteger(0, this.moveChance);
    if (chance !== 0) {
      return;
    }

    const exitDirections = Object.keys(this.character.room.exits);
    const exitChance = randomInteger(0, exitDirections.length - 1);
    const exit = this.character.room.exits[exitDirections[exitChance]];

    const destinationRoom = this.character.world.findRoomById(exit.destinationId);
    if (!destinationRoom) {
      log.warn({
        characterId: this.character.id,
        roomId: exit.destinationId,
      }, 'Destination room not found in area');
      return;
    }

    if (destinationRoom.areaId !== this.character.room.areaId) {
      // Don't let them leave the current area
      return;
    }

    this.character.moveToRoom(destinationRoom);
  }
}

export default RandomWanderer;