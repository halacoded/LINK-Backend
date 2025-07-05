const User = require("../models/User");
const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local").Strategy;
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github").Strategy;
const dotenv = require("dotenv");
dotenv.config();

const localStrategy = new LocalStrategy(
  {
    usernameField: "Username",
    passwordField: "password",
  },
  async (Username, password, done) => {
    try {
      const foundUser = await User.findOne({ Username });

      if (!foundUser) {
        return done(null, false, { message: "Username or password incorrect" });
      }

      const isMatch = await bcrypt.compare(password, foundUser.password);
      if (!isMatch) {
        return done(null, false, { message: "Username or password incorrect" });
      }

      return done(null, foundUser);
    } catch (error) {
      return done(error);
    }
  }
);

const jwtStrategy = new JWTStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
  },
  async (payload, done) => {
    try {
      const user = await User.findById(payload.id);
      if (!user) {
        return done(null, false, { message: "User not found" });
      }

      const expiry = new Date(payload.exp * 1000);
      if (new Date() > expiry) {
        return done(null, false, { message: "Token expired" });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
);

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      let user = await User.findOne({ Email: email });

      if (!user) {
        user = await User.create({
          Username: profile.displayName,
          Email: email,
          provider: "google",
          isThirdParty: true,
          profileComplete: false,
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
);

const githubStrategy = new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/auth/github/callback",
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      let user = await User.findOne({ Email: email });

      if (!user) {
        user = await User.create({
          Username: profile.username,
          Email: email || `${profile.username}@github.com`,
          provider: "github",
          isThirdParty: true,
          profileComplete: false,
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
);

module.exports = { localStrategy, jwtStrategy, googleStrategy, githubStrategy };
