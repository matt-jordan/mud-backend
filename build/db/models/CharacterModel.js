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
import mongoose from 'mongoose';
import inanimateRefSchema from './schemas/inanimateRefSchema.js';
;
const classSchema = new mongoose.Schema({
    type: { type: String },
    level: { type: Number },
    experience: { type: Number },
});
;
const physicalLocationSchema = new mongoose.Schema({
    item: { type: inanimateRefSchema }
});
;
const attributeSchema = new mongoose.Schema({
    base: { type: Number },
});
;
const modifiableAttributeSchema = new mongoose.Schema({
    base: { type: Number },
    current: { type: Number },
});
;
;
const defaultAttackSchema = new mongoose.Schema({
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
const skillSchema = new mongoose.Schema({
    name: { type: String, required: true },
    level: { type: Number, default: 0 },
});
;
const killsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    count: { type: Number, default: 0 },
    area: { type: String },
});
;
const factionRefSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: Number, required: true, default: 75 },
});
;
const questsCompletedSchema = new mongoose.Schema({
    name: { type: String, required: true },
    count: { type: Number, default: 0, },
});
;
const currencySchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, default: 0 },
});
;
;
;
;
const characterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    characterRef: { type: String },
    accountId: { type: mongoose.Schema.Types.ObjectId },
    description: { type: String },
    age: { type: Number },
    weight: { type: Number, default: 175 },
    height: { type: Number, default: 66 },
    gender: { type: String, enum: ['male', 'female', 'non-binary'] },
    roomId: { type: mongoose.Schema.Types.ObjectId },
    classes: [{ type: classSchema }],
    race: { type: String, default: 'human' },
    inanimates: [{ type: inanimateRefSchema }],
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
    conversationId: { type: mongoose.Schema.Types.ObjectId },
    partyId: { type: mongoose.Schema.Types.ObjectId },
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
characterSchema.static('findByAccountId', function (accountId) {
    return __awaiter(this, void 0, void 0, function* () {
        return CharacterModel.find({ accountId });
    });
});
const CharacterModel = mongoose.model('Character', characterSchema);
export default CharacterModel;
