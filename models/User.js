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
    Company: { type: String, enum: allowedCompanies, required: true },
    Role: { type: String, enum: allowedRoles, required: true },
    password: { type: String, required: true },
    ProfileImage: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = model("User", UserSchema);
