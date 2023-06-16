import express from "express";
import logger from "morgan";
import path from "path";
import createHttpError from "http-errors";
import cookie from "cookie-parser";

import api from "./routes/index.js";
import { handleErrorMw } from "./middlewares/error.js";

const app = express();
const __dirname = path.resolve();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
// app.disable("etag");

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");
  next();
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookie());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", api);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createHttpError(404));
});

app.use((err, req, res, next) => handleErrorMw(err, req, res, next));

export default app;
