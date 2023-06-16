import app from "express";
import MoviesRouter from "./movies.js";
import DirectorsRouter from "./directors.js";

const router = app.Router();

router.use("/movies", MoviesRouter);
router.use("/directors", DirectorsRouter);

export default router;
