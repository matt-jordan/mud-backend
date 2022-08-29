//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Character from './Character.js';
import randomInteger from '../../lib/randomInteger.js';
import { getPreceedingArticle } from '../../lib/stringHelpers.js';
import log from '../../lib/log.js';

/**
 * @module game/characters/Animal
 */

const DEFAULT_ANIMAL_MOVE_CHANCE = 20;

/**
 * A creature of some sort that behaves in a particular way
 *
 * Vague, to be sure. But the general idea is that the logic for how animals
 * behave is largely consistent, and that most of our logic can be handled by
 * the type of animals being constructed.
 *
 * Sub-classes, maybe.
 */
class Animal extends Character {

  /**
   * Make a new animal
   *
   * @param {CharacterModel} model - The model for the character
   * @param {World}          world - The world the character inhabits
   */
  constructor(model, world) {
    super(model, world);
    this.moveChance = DEFAULT_ANIMAL_MOVE_CHANCE;
  }

  /**
   * Provide a short description of the animal
   *
   * @returns {String}
   */
  toShortText() {
    const article = getPreceedingArticle(this.name);
    return `${article}${article.length > 0 ? ' ' : ''}${this.name}`;
  }

  /**
   * Process a cycle for this character
   */
  async onTick() {
    super.onTick();

    if (!this.room) {
      return;
    }

    const chance = randomInteger(0, this.moveChance);
    if (chance !== 0) {
      return;
    }

    const exitDirections = Object.keys(this.room.exits);
    const exitChance = randomInteger(0, exitDirections.length - 1);
    const exit = this.room.exits[exitDirections[exitChance]];

    const destinationRoom = this.world.findRoomById(exit.destinationId);
    if (!destinationRoom) {
      log.warn({
        action: this,
        characterId: this.id,
        roomId: exit.destinationId,
      }, 'Destination room not found in area');
      return;
    }

    if (destinationRoom.areaId !== this.room.areaId) {
      // Don't let them leave the current area
      return;
    }

    log.debug({ characterId: this.id, roomId: destinationRoom.id },
      `Moving ${this.name} to room`);
    this.moveToRoom(destinationRoom);
  }

}

export default Animal;
