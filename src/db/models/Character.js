import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.ObjectId;

const classSchema = new Schema({
  type: { type: String },
  level: { type: Number },
  experience: { type: Number },
});

const physicalLocationSchema = new Schema({
  item: { type: Schema.ObjectId },
});

const attributeSchema = new Schema({
  base: { type: Number },
});

const modifiableAttributeSchema = new Schema({
  base: { type: Number },
  current: { type: Number },
});

const characterSchema = new Schema({
  name: { type: String, required: true },
  accountId: { type: ObjectId, required: true },
  description: { type: String },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'non-binary'] },
  roomId: { type: ObjectId },
  classes: [{ type: classSchema }],
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
    leftFinger: { type: physicalLocationSchema },
    rightFinger: { type: physicalLocationSchema },
    leftHand: { type: physicalLocationSchema },
    rightHand: { type: physicalLocationSchema },
    back: { type: physicalLocationSchema },
  },
}, {
  timestamps: true,
});

characterSchema.statics.findByAccountId = async function(accountId) {
  return CharacterModel.find({ accountId });
};

const CharacterModel = mongoose.model('Character', characterSchema);

export default CharacterModel;