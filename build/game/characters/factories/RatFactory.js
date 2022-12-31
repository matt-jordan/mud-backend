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
const randomInteger_js_1 = __importDefault(require("../../../lib/randomInteger.js"));
const CharacterModel_js_1 = __importDefault(require("../../../db/models/CharacterModel.js"));
const Animal_js_1 = __importDefault(require("../Animal.js"));
/**
 * @module game/characters/factories/RatFactory
 */
/**
 * Class that generates a 'rat' {Animal}
 */
class RatFactory {
    /**
     * Create a new RatFactory
     *
     * @param {World} world - The world we live in
     * @param {Room}  room  - The room to generate the Animal in
     */
    constructor(world, room) {
        this.room = room;
        this.world = world;
    }
    /**
     * Generate a new {Animal} object representing a rat
     *
     * @returns {Animal}
     */
    async generate(factoryData) {
        let props;
        if (factoryData && factoryData.rat) {
            props = { ...factoryData.rat };
        }
        else {
            props = {};
        }
        const model = new CharacterModel_js_1.default();
        model.name = 'rat';
        model.characterRef = props.characterRef;
        model.description = 'A small rodent, generally thought to carry disease.';
        model.age = 1;
        model.weight = 2;
        model.roomId = this.room.id;
        model.gender = (0, randomInteger_js_1.default)(0, 1) === 0 ? 'male' : 'female';
        model.race = 'animal';
        model.size = 'tiny';
        model.attributes = {
            strength: { base: 4, },
            dexterity: { base: 12 },
            constitution: { base: 4 },
            intelligence: { base: 6 },
            wisdom: { base: 4 },
            charisma: { base: 2 },
            hitpoints: { base: 1, current: 1 },
            manapoints: { base: 0, current: 0 },
            energypoints: { base: 80, current: 80 },
        };
        model.defaultAttacks = [
            { energyCost: 3, minDamage: 0, maxDamage: 1, damageType: 'piercing', verbs: { firstPerson: 'bite', thirdPerson: 'bites' } }
        ];
        await model.save();
        const rat = new Animal_js_1.default(model, this.world);
        await rat.load();
        return rat;
    }
}
exports.default = RatFactory;
