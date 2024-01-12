import app from "express";
import MoviesRouter from "./movies.js";
// import DirectorsRouter from "./directors.js";
// import ActorsRouter from "./actors.js";
// import CommentsRouter from "./comments.js";
// import AuthRouter from "./auth.js";

const router = app.Router();

router.use("/movies", MoviesRouter);
// router.use("/directors", DirectorsRouter);
// router.use("/actors", ActorsRouter);
// router.use("/comments", CommentsRouter);
// router.use("/auth", AuthRouter);

export default router;
