const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  profilePictureUrl: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    enum: ["admin", "user"], // Allow only 'admin' and 'user' roles
    default: "user",
  },
  resetPassword: {
    otp: {
      type: String,
      required: false,
    },
    otpExpiry: {
      type: Date,
      required: false,
    },
  },
});

const UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel;
