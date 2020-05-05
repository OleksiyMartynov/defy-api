import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
    //public key
  _id: {
    type: String,
    minlength: 4,
    required: true
  },
  //balance 
  balance: { type: Number, default: 0 }
});
accountSchema.statics.accountForKey = function accountForKey(key) {
  return this.findOne({ pubKey: key });
};
const Account = mongoose.model("Account", accountSchema);
export default Account;
