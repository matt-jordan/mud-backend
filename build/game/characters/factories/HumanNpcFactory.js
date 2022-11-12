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
import asyncForEach from '../../../lib/asyncForEach.js';
import randomInteger from '../../../lib/randomInteger.js';
import CharacterModel from '../../../db/models/CharacterModel.js';
import ConversationModel from '../../../db/models/ConversationModel.js';
import Character from '../../characters/Character.js';
import BaseClass from '../../classes/BaseClass.js';
import objectFactories from '../../objects/factories/index.js';
import Human from '../Human.js';
/**
 * @module game/characters/factories/HumanNpcFactory
 */
/**
 * Class that generates a human NPC
 */
class HumanNpcFactory {
    /**
     * Create a new HumanNpcFactory
     *
     * @param {World} world - The world we live in
     * @param {Room}  room  - The room to generate the Animal in
     */
    constructor(world, room) {
        this.room = room;
        this.world = world;
    }
    /**
     * Generate a new Human
     *
     * @returns {Human}
     */
    generate(factoryData) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        return __awaiter(this, void 0, void 0, function* () {
            let props;
            if (factoryData && factoryData.humanNpc) {
                props = Object.assign({}, factoryData.humanNpc);
            }
            else {
                props = {};
            }
            const model = new CharacterModel();
            model.name = (_a = props.name) !== null && _a !== void 0 ? _a : 'human';
            model.characterRef = props.characterRef;
            model.description = (_b = props.description) !== null && _b !== void 0 ? _b : 'A medium sized creature prone to great ambition.';
            model.age = (_c = props.age) !== null && _c !== void 0 ? _c : randomInteger(18, 55);
            model.weight = (_d = props.weight) !== null && _d !== void 0 ? _d : randomInteger(155, 235);
            model.roomId = this.room.id;
            model.gender = (_e = props.gender) !== null && _e !== void 0 ? _e : (randomInteger(0, 1) === 0 ? 'male' : 'female');
            model.race = 'human';
            model.size = 'medium';
            model.attributes = {
                strength: { base: (_f = props.strength) !== null && _f !== void 0 ? _f : 10 },
                dexterity: { base: (_g = props.dexterity) !== null && _g !== void 0 ? _g : 10 },
                constitution: { base: (_h = props.constitution) !== null && _h !== void 0 ? _h : 10 },
                intelligence: { base: (_j = props.intelligence) !== null && _j !== void 0 ? _j : 10 },
                wisdom: { base: (_k = props.wisdom) !== null && _k !== void 0 ? _k : 10 },
                charisma: { base: (_l = props.charisma) !== null && _l !== void 0 ? _l : 10 },
                hitpoints: { base: 6, current: 6 },
                manapoints: { base: 6, current: 6 },
                energypoints: { base: 100, current: 100 },
            };
            model.defaultAttacks = [
                { energyCost: 3, minDamage: 0, maxDamage: 2, damageType: 'bludgeoning', verbs: { firstPerson: 'punch', thirdPerson: 'punches' } }
            ];
            // This should get moved to a base class of some sort
            if (props.conversationLoadId) {
                const conversationModel = yield ConversationModel.findByLoadId(props.conversationLoadId);
                model.conversationId = conversationModel._id;
            }
            if (props.classPackage) {
                model.classes = props.classPackage.map((classPackage) => {
                    return {
                        type: classPackage.class,
                        level: classPackage.level,
                        experience: BaseClass.characterLevels[classPackage.level],
                    };
                });
            }
            yield model.save();
            const human = new Human(model, this.world);
            yield human.load();
            // We should think about moving this into something else at some point. Note
            // that we generate this after object creation as the object factories will
            // create both the equipment and the object, and we can just assign the object
            // to specific locations on the generated NPC
            if (props.equipment) {
                const equipment = props.equipment;
                yield asyncForEach(Character.physicalLocations, (location) => __awaiter(this, void 0, void 0, function* () {
                    if (equipment[location]) {
                        const equipmentData = equipment[location];
                        const factory = objectFactories(equipmentData.type);
                        const item = yield factory(equipmentData.data);
                        human.physicalLocations[location].item = item;
                    }
                }));
            }
            if (props.factions) {
                props.factions.forEach((faction) => {
                    human.factions.initializeFaction(faction.name, faction.score || 100);
                });
            }
            // If we have character levels, this won't 'level up' the character. Process
            // the level changes.
            human.classes.forEach((characterClass) => {
                for (let i = 1; i <= characterClass.level; i++) {
                    characterClass.setLevel(i);
                }
                characterClass.setMaxSkills();
            });
            return human;
        });
    }
}
export default HumanNpcFactory;
