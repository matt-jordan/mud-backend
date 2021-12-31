import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;

const accountSchema = new Schema({
  accountName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  characterIds: [{ type: String }],
}, {
  timestamps: true,
});

accountSchema.methods.comparePassword = async function(password) {
  const result = await bcrypt.compare(password, this.password);
  return result;
};

accountSchema.pre('save', function(next) {
  const account = this;

  if (account.isNew || account.isModified('password')) {
    bcrypt.genSalt(10, (saltError, salt) => {
      if (saltError) {
        return next(saltError);
      }
      bcrypt.hash(account.password, salt, (hashError, hash) => {
        if (hashError) {
          return next(hashError);
        }

        account.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

if (!accountSchema.options.toObject) {
  accountSchema.options.toObject = {};
}
accountSchema.options.toObject.transform = function (_, ret) {
  delete ret._id;
  delete ret.password;

  return ret;
};

const AccountModel = mongoose.model('Account', accountSchema);

export default AccountModel;
