//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

import inanimateRefSchema, { IInanimateRefSchema } from './schemas/inanimateRefSchema.js';

interface IClassSchema {
  type: string;
  level: number;
  experience: number;
};

const classSchema = new mongoose.Schema<IClassSchema>({
  type: { type: String },
  level: { type: Number },
  experience: { type: Number },
});

interface IPhysicalLocationSchema {
  item: IInanimateRefSchema;
};

const physicalLocationSchema = new mongoose.Schema<IPhysicalLocationSchema>({
  item: { type: inanimateRefSchema }
});

interface IAttributeSchema {
  base: number;
};

const attributeSchema = new mongoose.Schema<IAttributeSchema>({
  base: { type: Number },
});

interface IModifiableAttributeSchema {
  base: number;
  current: number;
};

const modifiableAttributeSchema = new mongoose.Schema<IModifiableAttributeSchema>({
  base: { type: Number },
  current: { type: Number },
});

interface IDefaultAttackVerbSchema {
  firstPerson: String;
  thirdPerson: String;
};

interface IDefaultAttackSchema {
  energyCost: number;
  minDamage: number;
  maxDamage: number;
  damageType: string;
  verbs: IDefaultAttackVerbSchema;
};

const defaultAttackSchema = new mongoose.Schema<IDefaultAttackSchema>({
  energyCost: { type: Number, default: 3 },
  minDamage: { type: Number, default: 0 },
  maxDamage: { type: Number, default: 1 },
  damageType: { type: String, default: 'bludgeoning', enum: [ 'piercing', 'slashing', 'bludgeoning' ]},
  verbs: {
    firstPerson: { type: String, default: 'punch' },
    thirdPerson: { type: String, default: 'punches' },
  }
});

interface ISkillSchema {
  name: string;
  level: number;
};

const skillSchema = new mongoose.Schema<ISkillSchema>({
  name: { type: String, required: true },
  level: { type: Number, default: 0 },
});

interface IKillsSchema {
  name: string;
  count: number;
  area?: string;
};

const killsSchema = new mongoose.Schema<IKillsSchema>({
  name: { type: String, required: true },
  count: { type: Number, default: 0 },
  area: { type: String },
});

interface IFactionRefSchema {
  name: string;
  value: number;
};

const factionRefSchema = new mongoose.Schema<IFactionRefSchema>({
  name: { type: String, required: true },
  value: { type: Number, required: true, default: 75 },
});

interface IQuestsCompletedSchema {
  name: string;
  count: number;
};

const questsCompletedSchema = new mongoose.Schema<IQuestsCompletedSchema>({
  name: { type: String, required: true },
  count: { type: Number, default: 0, },
});

interface ICurrencySchema {
  name: string;
  quantity: number;
};

const currencySchema = new mongoose.Schema<ICurrencySchema>({
  name: { type: String, required: true },
  quantity: { type: Number, default: 0 },
});

interface ICharacterAttributesSchema {
  strength: IAttributeSchema;
  dexterity: IAttributeSchema;
  constitution: IAttributeSchema;
  intelligence: IAttributeSchema;
  wisdom: IAttributeSchema;
  charisma: IAttributeSchema;
  hitpoints: IModifiableAttributeSchema;
  manapoints: IModifiableAttributeSchema;
  energypoints: IModifiableAttributeSchema;
};

interface IPhysicalLocations {
  head: IPhysicalLocationSchema;
  body: IPhysicalLocationSchema;
  neck: IPhysicalLocationSchema;
  hands: IPhysicalLocationSchema;
  legs: IPhysicalLocationSchema;
  feet: IPhysicalLocationSchema;
  arms: IPhysicalLocationSchema;
  leftFinger: IPhysicalLocationSchema;
  rightFinger: IPhysicalLocationSchema;
  leftHand: IPhysicalLocationSchema;
  rightHand: IPhysicalLocationSchema;
  back: IPhysicalLocationSchema;
};

interface ICharacterSchema {
  name: string;
  characterRef?: string;
  accountId?: mongoose.Types.ObjectId;
  description?: string;
  age?: number;
  weight?: number;
  height?: number;
  gender: string;
  roomId?: mongoose.Types.ObjectId;
  classes: IClassSchema[];
  race: string;
  inanimates: IInanimateRefSchema[];
  size: string;
  attributes: ICharacterAttributesSchema;
  physicalLocations: IPhysicalLocationSchema;
  isDead: boolean;
  defaultAttacks: IDefaultAttackSchema[];
  skills: ISkillSchema[];
  kills: IKillsSchema[];
  questsCompleted: IQuestsCompletedSchema[];
  factions: IFactionRefSchema[];
  currencies: ICurrencySchema[];
  conversationId: mongoose.Types.ObjectId;
  partyId: mongoose.Types.ObjectId;
};

interface ICharacterMethods {
  findByAccountId(accountId: string): Promise<ICharacterSchema>;
};

type CharacterModelType = mongoose.Model<ICharacterSchema, {}, ICharacterMethods>;

const characterSchema = new mongoose.Schema<ICharacterSchema, CharacterModelType, ICharacterMethods>({
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
  kills: [{ type: killsSchema }],
  questsCompleted: [{ type: questsCompletedSchema }],
  factions: [{ type: factionRefSchema }],
  currencies: [{ type: currencySchema }],
  conversationId: { type: mongoose.Schema.Types.ObjectId },
  partyId: { type: mongoose.Schema.Types.ObjectId },
}, {
  timestamps: true,
  toObject: {
    transform: function(doc: any, ret: any): any {
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
      ret.classes.forEach((characterClass: any) => {
        delete characterClass._id;
      });
      delete ret._id;
      return ret;
    },
  },
});

characterSchema.static('findByAccountId', async function(accountId: string) {
  return CharacterModel.find({ accountId });
});

const CharacterModel = mongoose.model<ICharacterSchema, CharacterModelType, ICharacterMethods>('Character', characterSchema);

export default CharacterModel;