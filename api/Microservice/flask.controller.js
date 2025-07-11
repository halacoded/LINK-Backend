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
  const userId = req.user?._id;
  const filePath = req.file.path;
  const rawData = [];

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        rawData.push(row);
      })
      .on("end", async () => {
        // Send raw structured data to Flask
        const flaskResponse = await axios.post(
          "http://localhost:5000/predict-batch",
          {
            data: rawData,
          }
        );

        fs.unlinkSync(filePath);

        const enriched = flaskResponse.data.predictions;

        await Prediction.create({
          userId,
          enrichedData: enriched,
          uploadedAt: new Date(),
        });

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

    const enriched = latest.enrichedData;

    res.status(200).json({ predictions: enriched });
  } catch (error) {
    console.error("Error fetching predictions:", error.message);
    res.status(500).json({ error: "Failed to load predictions." });
  }
};
