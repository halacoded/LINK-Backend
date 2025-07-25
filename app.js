//import
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./database");
const NotFoundHandller = require("./middleware/notFoundHandler");
const ErrorHandler = require("./middleware/errorHandler");
const passport = require("passport");
const path = require("path");
const {
  localStrategy,
  jwtStrategy,
  googleStrategy,
  githubStrategy,
} = require("./middleware/passport.js");

//import route
const usersRouter = require("./api/User/User.router.js");
const thirdpartyRouter = require("./api/third-party authentication/router.js");
const flaskRoutes = require("./api/Microservice/flask.route");
//init
dotenv.config();
const app = express();
connectDB();
const Port = process.env.PORT;
//middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(passport.initialize());
passport.use("local", localStrategy);
passport.use("jwt", jwtStrategy);
passport.use("google", googleStrategy);
passport.use("github", githubStrategy);
//Routes
app.use("/api/users", usersRouter);
app.use("/media", express.static(path.join(__dirname, "media")));
app.use("/auth", thirdpartyRouter);
app.use("/api/flask", flaskRoutes);

//Handler
app.use(NotFoundHandller);
app.use(ErrorHandler);
//start listen
app.listen(Port, () => {
  console.log(`Server running on ${Port}`);
});
