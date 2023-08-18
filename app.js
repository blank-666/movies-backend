import express from "express";
import logger from "morgan";
import path from "path";
import createHttpError from "http-errors";
import cookie from "cookie-parser";

import api from "./api/routers/index.js";
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
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
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

app.use((err, req, res, next) => handleErrorMw(err, req, res, next));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).json({
    status: 404,
    message: "Route not found.",
  });
});

export default app;
