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
const asyncForEach_js_1 = __importDefault(require("../../../lib/asyncForEach.js"));
const randomInteger_js_1 = __importDefault(require("../../../lib/randomInteger.js"));
const CharacterModel_js_1 = __importDefault(require("../../../db/models/CharacterModel.js"));
const ConversationModel_js_1 = __importDefault(require("../../../db/models/ConversationModel.js"));
const Character_js_1 = __importDefault(require("../../characters/Character.js"));
const BaseClass_js_1 = __importDefault(require("../../classes/BaseClass.js"));
const index_js_1 = __importDefault(require("../../objects/factories/index.js"));
const Human_js_1 = __importDefault(require("../Human.js"));
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
    async generate(factoryData) {
        let props;
        if (factoryData && factoryData.humanNpc) {
            props = { ...factoryData.humanNpc };
        }
        else {
            props = {};
        }
        const model = new CharacterModel_js_1.default();
        model.name = props.name ?? 'human';
        model.characterRef = props.characterRef;
        model.description = props.description ?? 'A medium sized creature prone to great ambition.';
        model.age = props.age ?? (0, randomInteger_js_1.default)(18, 55);
        model.weight = props.weight ?? (0, randomInteger_js_1.default)(155, 235);
        model.roomId = this.room.id;
        model.gender = props.gender ?? ((0, randomInteger_js_1.default)(0, 1) === 0 ? 'male' : 'female');
        model.race = 'human';
        model.size = 'medium';
        model.attributes = {
            strength: { base: props.strength ?? 10 },
            dexterity: { base: props.dexterity ?? 10 },
            constitution: { base: props.constitution ?? 10 },
            intelligence: { base: props.intelligence ?? 10 },
            wisdom: { base: props.wisdom ?? 10 },
            charisma: { base: props.charisma ?? 10 },
            hitpoints: { base: 6, current: 6 },
            manapoints: { base: 6, current: 6 },
            energypoints: { base: 100, current: 100 },
        };
        model.defaultAttacks = [
            { energyCost: 3, minDamage: 0, maxDamage: 2, damageType: 'bludgeoning', verbs: { firstPerson: 'punch', thirdPerson: 'punches' } }
        ];
        // This should get moved to a base class of some sort
        if (props.conversationLoadId) {
            const conversationModel = await ConversationModel_js_1.default.findByLoadId(props.conversationLoadId);
            model.conversationId = conversationModel._id;
        }
        if (props.classPackage) {
            model.classes = props.classPackage.map((classPackage) => {
                return {
                    type: classPackage.class,
                    level: classPackage.level,
                    experience: BaseClass_js_1.default.characterLevels[classPackage.level],
                };
            });
        }
        await model.save();
        const human = new Human_js_1.default(model, this.world);
        await human.load();
        // We should think about moving this into something else at some point. Note
        // that we generate this after object creation as the object factories will
        // create both the equipment and the object, and we can just assign the object
        // to specific locations on the generated NPC
        if (props.equipment) {
            const equipment = props.equipment;
            await (0, asyncForEach_js_1.default)(Character_js_1.default.physicalLocations, async (location) => {
                if (equipment[location]) {
                    const equipmentData = equipment[location];
                    const factory = (0, index_js_1.default)(equipmentData.type);
                    const item = await factory(equipmentData.data);
                    human.physicalLocations[location].item = item;
                }
            });
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
    }
}
exports.default = HumanNpcFactory;
