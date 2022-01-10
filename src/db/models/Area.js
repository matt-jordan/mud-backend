import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.ObjectId;

const areaSchema = new Schema({
  name: { type: String, required: true },
  roomIds: [{ type: ObjectId }],
}, {
  timestamps: true,
});

const AreaModel = mongoose.model('Area', areaSchema);

export default AreaModel;
