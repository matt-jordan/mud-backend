//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

import inanimateRefSchema from './schemas/inanimateRefSchema.js';

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.ObjectId;

const classSchema = new Schema({
  type: { type: String },
  level: { type: Number },
  experience: { type: Number },
});

const physicalLocationSchema = new Schema({
  item: { type: inanimateRefSchema }
});

const attributeSchema = new Schema({
  base: { type: Number },
});

const modifiableAttributeSchema = new Schema({
  base: { type: Number },
  current: { type: Number },
});

const defaultAttackSchema = new Schema({
  minDamage: { type: Number, default: 0 },
  maxDamage: { type: Number, default: 1 },
  damageType: { type: String, default: 'bludgeoning', enum: [ 'piercing', 'slashing', 'bludgeoning' ]},
  verbs: {
    firstPerson: { type: String, default: 'punch' },
    thirdPerson: { type: String, default: 'punches' },
  }
});

const skillSchema = new Schema({
  name: { type: String, required: true },
  level: { type: Number, default: 0 },
});

const characterSchema = new Schema({
  name: { type: String, required: true },
  accountId: { type: ObjectId },
  description: { type: String },
  age: { type: Number },
  weight: { type: Number, default: 175 },
  gender: { type: String, enum: ['male', 'female', 'non-binary'] },
  roomId: { type: ObjectId },
  classes: [{ type: classSchema }],
  race: { type: String, default: 'human' },
  inanimates: [{ type: inanimateRefSchema }],
  size: { type: String, default: 'medium', enum: ['tiny', 'small', 'medium', 'large', 'giant', 'collosal']},
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
}, {
  timestamps: true,
});

characterSchema.statics.findByAccountId = async function(accountId) {
  return CharacterModel.find({ accountId });
};

if (!characterSchema.options.toObject) {
  characterSchema.options.toObject = {};
}
characterSchema.options.toObject.transform = function (_, ret) {
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
};

const CharacterModel = mongoose.model('Character', characterSchema);

export default CharacterModel;