const axios = require("axios");
const fs = require("fs");
const csv = require("csv-parser");

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
  const filePath = req.file.path;
  const featuresArray = [];

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        const values = Object.values(row).map(Number);
        featuresArray.push(values);
      })
      .on("end", async () => {
        const flaskResponse = await axios.post(
          "http://localhost:5000/predict-batch",
          {
            data: featuresArray,
          }
        );

        fs.unlinkSync(filePath);
        res.status(200).json({ predictions: flaskResponse.data.predictions });
      });
  } catch (error) {
    console.error("Batch Prediction Error:", error.message);
    res.status(500).json({ error: "Batch prediction failed" });
  }
};
