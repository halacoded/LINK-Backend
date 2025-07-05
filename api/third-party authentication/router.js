const express = require("express");
const passport = require("passport");
const { handleGoogleCallback, handleGitHubCallback } = require("./controller");

const thirdpartyRouter = express.Router();

// Google Login
thirdpartyRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

thirdpartyRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  handleGoogleCallback
);

// GitHub Login
thirdpartyRouter.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
  })
);

thirdpartyRouter.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "/" }),
  handleGitHubCallback
);

module.exports = thirdpartyRouter;
