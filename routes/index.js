import app from "express";
import MoviesRouter from "./movies.js";

const router = app.Router();

router.use("/movies", MoviesRouter);

/* GET home page. */
router.get("/", (req, res, next) => {
  console.log("initial request");
  res.send("Hi thereee!");
});

export default router;
