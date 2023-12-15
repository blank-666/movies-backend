import app from "express";
import { createActor, getAllActors } from "../controllers/actors.js";

const router = app.Router();

router.get("/", getAllActors);

router.post("/", createActor);

export default router;
