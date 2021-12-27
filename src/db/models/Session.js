import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.ObjectId;

const sessionSchema = new Schema({
  accountId: { type: ObjectId, required: true },
}, {
  timestamps: true,
});

sessionSchema.statics.findByAccountId = async function(accountId) {
  return SessionModel.findOne({ accountId });
}

if (!sessionSchema.options.toObject) {
  sessionSchema.options.toObject = {};
}
sessionSchema.options.toObject.transform = function (_, ret) {
  delete ret._id;
  return ret;
};

const SessionModel = mongoose.model('Session', sessionSchema);

export default SessionModel;
