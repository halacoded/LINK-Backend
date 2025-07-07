const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const { getPrediction, getBatchPrediction } = require("./flask.controller");

router.post("/predict-batch", upload.single("file"), getBatchPrediction);
router.post("/predict", getPrediction);

module.exports = router;
