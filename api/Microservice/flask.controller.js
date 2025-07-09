const axios = require("axios");
const fs = require("fs");
const csv = require("csv-parser");
const Prediction = require("../../models/Prediction");
const User = require("../../models/User");
exports.getPrediction = async (req, res) => {
  try {
    const inputData = req.body.data;

    const response = await axios.post("http://localhost:5000/predict", {
      data: inputData,
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Flask Microservice Error:", error.message);
    res.status(500).json({ error: "Failed to retrieve prediction" });
  }
};

exports.getBatchPrediction = async (req, res) => {
  const userId = req.user?._id; // 🛡️ safely get user ID
  const filePath = req.file.path;
  const rawData = [];
  const featuresArray = [];

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        rawData.push(row);
        featuresArray.push(Object.values(row).map(Number));
      })
      .on("end", async () => {
        const flaskResponse = await axios.post(
          "http://localhost:5000/predict-batch",
          {
            data: featuresArray,
          }
        );

        fs.unlinkSync(filePath);

        await Prediction.create({
          userId, // ✅ now works without error
          rawData,
          predictions: flaskResponse.data.predictions,
        });

        const enriched = rawData.map((row, i) => ({
          ...row,
          prediction: flaskResponse.data.predictions[i],
          churn: flaskResponse.data.predictions[i] === 1 ? "Yes" : "No",
        }));

        res.status(200).json({ predictions: enriched });
      });
  } catch (error) {
    console.error("Batch Prediction Error:", error.message);
    res.status(500).json({ error: "Batch prediction failed" });
  }
};

exports.getLatestUserPredictions = async (req, res) => {
  try {
    const latest = await Prediction.findOne({ userId: req.user._id })
      .sort({ uploadedAt: -1 })
      .lean();

    if (!latest) {
      return res.status(200).json({ predictions: [] });
    }

    const enriched = latest.rawData.map((row, index) => ({
      ...row,
      prediction: latest.predictions[index],
      churn: latest.predictions[index] === 1 ? "Yes" : "No",
    }));

    res.status(200).json({ predictions: enriched });
  } catch (error) {
    console.error("Error fetching predictions:", error.message);
    res.status(500).json({ error: "Failed to load predictions." });
  }
};
