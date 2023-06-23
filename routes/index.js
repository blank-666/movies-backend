import app from "express";
import MoviesRouter from "./movies.js";
import DirectorsRouter from "./directors.js";
import ActorsRouter from "./actors.js";

const router = app.Router();

router.use("/movies", MoviesRouter);
router.use("/directors", DirectorsRouter);
router.use("/actors", ActorsRouter);

export default router;
