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
import randomInteger from '../../../lib/randomInteger.js';
import CharacterModel from '../../../db/models/CharacterModel.js';
import Animal from '../Animal.js';
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
    generate(factoryData) {
        return __awaiter(this, void 0, void 0, function* () {
            let props;
            if (factoryData && factoryData.rat) {
                props = Object.assign({}, factoryData.rat);
            }
            else {
                props = {};
            }
            const model = new CharacterModel();
            model.name = 'rat';
            model.characterRef = props.characterRef;
            model.description = 'A small rodent, generally thought to carry disease.';
            model.age = 1;
            model.weight = 2;
            model.roomId = this.room.id;
            model.gender = randomInteger(0, 1) === 0 ? 'male' : 'female';
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
            yield model.save();
            const rat = new Animal(model, this.world);
            yield rat.load();
            return rat;
        });
    }
}
export default RatFactory;
