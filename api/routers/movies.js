import app from "express";
import multer from "multer";
import {
  createMovie,
  deleteMovies,
  getAllMovies,
  getFilters,
  getMovieById,
  toggleFavorites,
  updateMovie,
} from "../controllers/movies.js";

const router = app.Router();
const upload = multer();

router.get("/filters", getFilters);

router.get("/", getAllMovies);

router.get("/:id", getMovieById);

router.post("/", upload.single("poster"), createMovie);

router.put("/toggleFavorites", toggleFavorites);

router.put("/:id", upload.single("poster"), updateMovie);

router.post("/delete", deleteMovies);

export default router;
