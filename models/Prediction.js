const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const PredictionSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rawData: [Schema.Types.Mixed], // original rows
  predictions: [Number], // 0 or 1
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = model("Prediction", PredictionSchema);
