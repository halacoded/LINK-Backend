const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const allowedCompanies = [
  "Huawei",
  "Kuwait University",
  "STC",
  "Zain",
  "Ooredoo",
];
const allowedRoles = ["Admin", "Manager", "Engineer", "Student", "Guest"];

const UserSchema = new Schema(
  {
    Username: { type: String, required: true, unique: true },
    Email: { type: String, required: true, unique: true },
    Company: { type: String, enum: allowedCompanies },
    Role: { type: String, enum: allowedRoles },
    password: { type: String },
    ProfileImage: { type: String, default: "" },
    provider: { type: String }, // google github local
    isThirdParty: { type: Boolean, default: false },
    profileComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model("User", UserSchema);
