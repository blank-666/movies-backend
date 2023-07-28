import app from "express";
import { createDirector, getAllDirectors } from "../controllers/directors.js";

const router = app.Router();

router.get("/", getAllDirectors);

router.post("/", createDirector);

export default router;
