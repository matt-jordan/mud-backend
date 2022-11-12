//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import RatFactory from '../factories/RatFactory.js';
import HumanNpcFactory from '../factories/HumanNpcFactory.js';
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
    onTick() {
        return __awaiter(this, void 0, void 0, function* () {
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
                // WHY ARE WE DOING THIS ON EVERY TICK
                if (!(factoryType in this.factories)) {
                    // TODO: We should make this slightly more dynamic (or at least a LUT)
                    switch (factoryType) {
                        case 'RatFactory': {
                            this.factories[factoryType] = new RatFactory(this.world, this.room);
                            break;
                        }
                        case 'HumanNpcFactory': {
                            this.factories[factoryType] = new HumanNpcFactory(this.world, this.room);
                            break;
                        }
                        default:
                            break;
                    }
                }
                if (!this.factories[factoryType]) {
                    continue;
                }
                mobsToGenerate.push(this.factories[factoryType]);
            }
            yield asyncForEach(mobsToGenerate, (generator) => __awaiter(this, void 0, void 0, function* () {
                const mob = yield generator.generate(this.model.factoryData);
                log.debug({ roomId: this.room.id, characterId: mob.id }, `Generated new ${mob.name}`);
                this._addCharacter(mob);
            }));
        });
    }
    /**
     * Save the spawner
     */
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            const state = {};
            // TODO: Modify for other spawners
            state.currentTick = this.currentTick;
            state.characterIds = this.characters.map((character) => character.id);
            this.model.state = state;
            this.model.markModified('state');
            yield this.model.save();
        });
    }
    /**
     * Load the spawner and its last known state
     *
     * Note that this should be triggered by rooms, but after characters are loaded.
     * Otherwise it won't be able to find the characters it tracks and will discard them.
     */
    load() {
        return __awaiter(this, void 0, void 0, function* () {
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
                        }
                        else {
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
                    case 'HumanNpcFactory': {
                        const factory = new HumanNpcFactory(this.world, this.room);
                        this.factories['HumanNpcFactory'] = factory;
                        break;
                    }
                    default:
                        break;
                }
            });
        });
    }
}
export default Spawner;
