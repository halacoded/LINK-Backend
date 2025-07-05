const express = require("express");
const usersRouter = express.Router();
const {
  signup,
  login,
  getMe,
  getAllUsers,
  updateUser,
  getUserByUsername,
} = require("./User.controller");
const passport = require("passport");
const upload = require("../../middleware/multer");

const authenticate = passport.authenticate("jwt", { session: false });

// Authentication routes
usersRouter.post("/signup", signup); //Tested
usersRouter.post(
  "/login",
  passport.authenticate("local", { session: false }), //Tested
  login
);

// User routes
usersRouter.get("/me", authenticate, getMe); //Tested
usersRouter.get("/all", authenticate, getAllUsers); //Tested
usersRouter.put(
  "/update",
  (req, res, next) => {
    console.log("🔍 Incoming PUT /update");
    console.log("Authorization Header:", req.headers.authorization);
    next();
  },
  authenticate,
  upload.fields([{ name: "ProfileImage", maxCount: 1 }]), //Tested
  updateUser
);
usersRouter.get("/:Username", authenticate, getUserByUsername); //Tested
module.exports = usersRouter;
