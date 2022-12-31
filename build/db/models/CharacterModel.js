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
const mongoose_1 = __importDefault(require("mongoose"));
const inanimateRefSchema_js_1 = __importDefault(require("./schemas/inanimateRefSchema.js"));
;
const classSchema = new mongoose_1.default.Schema({
    type: { type: String },
    level: { type: Number },
    experience: { type: Number },
});
;
const physicalLocationSchema = new mongoose_1.default.Schema({
    item: { type: inanimateRefSchema_js_1.default }
});
;
const attributeSchema = new mongoose_1.default.Schema({
    base: { type: Number },
});
;
const modifiableAttributeSchema = new mongoose_1.default.Schema({
    base: { type: Number },
    current: { type: Number },
});
;
;
const defaultAttackSchema = new mongoose_1.default.Schema({
    energyCost: { type: Number, default: 3 },
    minDamage: { type: Number, default: 0 },
    maxDamage: { type: Number, default: 1 },
    damageType: { type: String, default: 'bludgeoning', enum: ['piercing', 'slashing', 'bludgeoning'] },
    verbs: {
        firstPerson: { type: String, default: 'punch' },
        thirdPerson: { type: String, default: 'punches' },
    }
});
;
const skillSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    level: { type: Number, default: 0 },
});
;
const killsSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    count: { type: Number, default: 0 },
    area: { type: String },
});
;
const factionRefSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    value: { type: Number, required: true, default: 75 },
});
;
const questsCompletedSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    count: { type: Number, default: 0, },
});
;
const currencySchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, default: 0 },
});
;
;
;
;
const characterSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    characterRef: { type: String },
    accountId: { type: mongoose_1.default.Schema.Types.ObjectId },
    description: { type: String },
    age: { type: Number },
    weight: { type: Number, default: 175 },
    height: { type: Number, default: 66 },
    gender: { type: String, enum: ['male', 'female', 'non-binary'] },
    roomId: { type: mongoose_1.default.Schema.Types.ObjectId },
    classes: [{ type: classSchema }],
    race: { type: String, default: 'human' },
    inanimates: [{ type: inanimateRefSchema_js_1.default }],
    size: { type: String, default: 'medium', enum: ['tiny', 'small', 'medium', 'large', 'giant', 'collosal'] },
    attributes: {
        strength: { type: attributeSchema },
        dexterity: { type: attributeSchema },
        constitution: { type: attributeSchema },
        intelligence: { type: attributeSchema },
        wisdom: { type: attributeSchema },
        charisma: { type: attributeSchema },
        hitpoints: { type: modifiableAttributeSchema },
        manapoints: { type: modifiableAttributeSchema },
        energypoints: { type: modifiableAttributeSchema },
    },
    physicalLocations: {
        head: { type: physicalLocationSchema },
        body: { type: physicalLocationSchema },
        neck: { type: physicalLocationSchema },
        hands: { type: physicalLocationSchema },
        legs: { type: physicalLocationSchema },
        feet: { type: physicalLocationSchema },
        arms: { type: physicalLocationSchema },
        leftFinger: { type: physicalLocationSchema },
        rightFinger: { type: physicalLocationSchema },
        leftHand: { type: physicalLocationSchema },
        rightHand: { type: physicalLocationSchema },
        back: { type: physicalLocationSchema },
    },
    isDead: { type: Boolean, default: false, },
    defaultAttacks: [{ type: defaultAttackSchema }],
    skills: [{ type: skillSchema }],
    kills: [{ type: killsSchema }],
    questsCompleted: [{ type: questsCompletedSchema }],
    factions: [{ type: factionRefSchema }],
    currencies: [{ type: currencySchema }],
    conversationId: { type: mongoose_1.default.Schema.Types.ObjectId },
    partyId: { type: mongoose_1.default.Schema.Types.ObjectId },
}, {
    timestamps: true,
    toObject: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            if (ret.attributes) {
                const attributes = {
                    strength: ret.attributes.strength.base,
                    dexterity: ret.attributes.dexterity.base,
                    constitution: ret.attributes.constitution.base,
                    intelligence: ret.attributes.intelligence.base,
                    wisdom: ret.attributes.wisdom.base,
                    charisma: ret.attributes.charisma.base,
                    hitpoints: ret.attributes.hitpoints,
                    manapoints: ret.attributes.manapoints,
                    energypoints: ret.attributes.energypoints,
                };
                ret.attributes = attributes;
                delete ret.attributes.hitpoints._id;
                delete ret.attributes.manapoints._id;
                delete ret.attributes.energypoints._id;
            }
            ret.classes.forEach((characterClass) => {
                delete characterClass._id;
            });
            delete ret._id;
            return ret;
        },
    },
});
characterSchema.static('findByAccountId', async function (accountId) {
    return CharacterModel.find({ accountId });
});
const CharacterModel = mongoose_1.default.model('Character', characterSchema);
exports.default = CharacterModel;
