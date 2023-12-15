import app from "express";
import { getCommentsById, createComment } from "../controllers/comments.js";
import { checkAuthorization } from "../../../middlewares/validateAuth.js";

const router = app.Router();

router.get("/:id", getCommentsById);

router.post("/", checkAuthorization, createComment);

export default router;
