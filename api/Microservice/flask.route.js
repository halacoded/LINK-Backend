const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const {
  getPrediction,
  getBatchPrediction,
  getLatestUserPredictions,
} = require("./flask.controller");

const passport = require("passport");
const authenticate = passport.authenticate("jwt", { session: false });

router.post(
  "/predict-batch",
  authenticate,
  upload.single("file"),
  getBatchPrediction
);
router.post("/predict", authenticate, getPrediction);
router.get("/user-predictions", authenticate, getLatestUserPredictions);
module.exports = router;
