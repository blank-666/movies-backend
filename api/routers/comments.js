import app from "express";
import { getCommentsById, createComment } from "../controllers/comments.js";

const router = app.Router();

router.get("/:id", getCommentsById);

router.post("/", createComment);

export default router;
