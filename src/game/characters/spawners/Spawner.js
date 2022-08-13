//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import RatFactory from '../factories/RatFactory.js';
import World from '../../world/World.js';

import asyncForEach from '../../../lib/asyncForEach.js';
import randomInteger from '../../../lib/randomInteger.js';
import log from '../../../lib/log.js';

/**
 * @module game/characters/spawners/Spawner
 */

/**
 * A class that manages spawning things
 */
class Spawner {

  /**
   * Create a new spawner
   *
   * @param {SpawnerModel} model - The database model backing this spawner
   * @param {Room}         room  - The room this spawner exists in
   */
  constructor(model, room) {
    this.model = model;
    this.room = room;
    this.world = World.getInstance();
    this.factories = {};
    this.characters = [];
    this.currentTick = 0;
  }

  get id() {
    return this.model._id;
  }

  _addCharacter(character) {
    character.on('death', (character) => {
      const index = this.characters.indexOf(character);
      if (index > -1) {
        log.debug({ characterId: character.id }, 'Removing tracking of character from associated spawner');
        this.characters.splice(index, 1);
      }
    });

    this.characters.push(character);
    character.moveToRoom(this.room);
  }

  async onTick() {
    this.currentTick += 1;
    let shouldSpawn = false;

    switch (this.model.triggerType) {
    case 'tick':
      shouldSpawn = this.currentTick % this.model.triggerUpperLimit === 0;
      break;
    default:
      break;
    }

    if (!shouldSpawn) {
      return;
    }

    const monstersToSpawn = this.model.spawnsPerTrigger - this.characters.length;
    if (monstersToSpawn === 0) {
      return;
    }

    const mobsToGenerate = [];
    for (let i = 0; i < monstersToSpawn; i += 1) {
      let factoryType;

      switch (this.model.characterSelection) {
      case 'random': {
        const index = randomInteger(0, this.model.characterFactories.length - 1);
        factoryType = this.model.characterFactories[index];
        break;
      }
      default:
        break;
      }

      if (!factoryType) {
        continue;
      }

      // TODO: We should make this slightly more dynamic (or at least a LUT)
      switch (factoryType) {
      case 'RatFactory': {
        if (!(factoryType in this.factories)) {
          this.factoryType[factoryType] = new RatFactory(this.world, this.room);
        }
        break;
      }
      default:
        break;
      }

      if (!this.factories[factoryType]) {
        continue;
      }

      mobsToGenerate.push(this.factories[factoryType]);
    }

    await asyncForEach(mobsToGenerate, async (generator) => {
      const mob = await generator.generate();
      log.debug({ roomId: this.room.id, characterId: mob.id }, `Generated new ${mob.name}`);
      this._addCharacter(mob);
    });
  }

  /**
   * Save the spawner
   */
  async save() {
    const state = {};

    // TODO: Modify for other spawners
    state.currentTick = this.currentTick;
    state.characterIds = this.characters.map((character) => character.id);
    this.model.state = state;

    this.model.markModified('state');
    await this.model.save();
  }

  /**
   * Load the spawner and its last known state
   *
   * Note that this should be triggered by rooms, but after characters are loaded.
   * Otherwise it won't be able to find the characters it tracks and will discard them.
   */
  async load() {

    const state = this.model.state;
    if (state) {
      if (state.currentTick) {
        this.currentTick = state.currentTick;
      }
      if (state.characterIds) {
        state.characterIds.forEach((characterId) => {
          const character = this.world.characters.find((c) => c.id === characterId);
          if (!character) {
            log.warn({ roomId: this.room.id, characterId }, 'Failed to find character in world');
          } else {
            this._addCharacter(character);
          }
        });
      }
    }

    this.model.characterFactories.forEach((factoryName) => {
      // TODO: We should make this slightly more dynamic (or at least a LUT)
      switch (factoryName) {
      case 'RatFactory': {
        const factory = new RatFactory(this.world, this.room);
        this.factories['RatFactory'] = factory;
        break;
      }
      default:
        break;
      }
    });
  }
}

export default Spawner;