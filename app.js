//import
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./database");
const NotFoundHandller = require("./middleware/notFoundHandler");
const ErrorHandler = require("./middleware/errorHandler");

//init
dotenv.config();
const app = express();
connectDB();
const Port = process.env.PORT;
//middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
//Routes

//Handler
app.use(NotFoundHandller);
app.use(ErrorHandler);
//start listen
app.listen(Port, () => {
  console.log(`Server running on ${Port}`);
});
