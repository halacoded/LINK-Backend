const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const PredictionSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  enrichedData: [Schema.Types.Mixed], // full enriched prediction rows
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = model("Prediction", PredictionSchema);
