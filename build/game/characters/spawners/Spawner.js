"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const RatFactory_js_1 = __importDefault(require("../factories/RatFactory.js"));
const HumanNpcFactory_js_1 = __importDefault(require("../factories/HumanNpcFactory.js"));
const World_js_1 = __importDefault(require("../../world/World.js"));
const asyncForEach_js_1 = __importDefault(require("../../../lib/asyncForEach.js"));
const randomInteger_js_1 = __importDefault(require("../../../lib/randomInteger.js"));
const log_js_1 = __importDefault(require("../../../lib/log.js"));
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
        this.world = World_js_1.default.getInstance();
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
                log_js_1.default.debug({ characterId: character.id }, 'Removing tracking of character from associated spawner');
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
                    const index = (0, randomInteger_js_1.default)(0, this.model.characterFactories.length - 1);
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
                        this.factories[factoryType] = new RatFactory_js_1.default(this.world, this.room);
                        break;
                    }
                    case 'HumanNpcFactory': {
                        this.factories[factoryType] = new HumanNpcFactory_js_1.default(this.world, this.room);
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
        await (0, asyncForEach_js_1.default)(mobsToGenerate, async (generator) => {
            const mob = await generator.generate(this.model.factoryData);
            log_js_1.default.debug({ roomId: this.room.id, characterId: mob.id }, `Generated new ${mob.name}`);
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
                        log_js_1.default.warn({ roomId: this.room.id, characterId }, 'Failed to find character in world');
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
                    const factory = new RatFactory_js_1.default(this.world, this.room);
                    this.factories['RatFactory'] = factory;
                    break;
                }
                case 'HumanNpcFactory': {
                    const factory = new HumanNpcFactory_js_1.default(this.world, this.room);
                    this.factories['HumanNpcFactory'] = factory;
                    break;
                }
                default:
                    break;
            }
        });
    }
}
exports.default = Spawner;
