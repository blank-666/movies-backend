import app from "express";
import multer from "multer";
import { getAllMovies, getFilters } from "../controllers/movies.js";

const router = app.Router();
const upload = multer();

router.get("/filters", getFilters);

router.get("/", getAllMovies);

export default router;
