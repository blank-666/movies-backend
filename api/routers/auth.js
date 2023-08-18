import app from "express";
import { signInController, signUpController } from "../controllers/auth.js";
import {
  validateSignUpFields,
  validateSignInFields,
} from "../../middlewares/validateAuth.js";

const router = app.Router();

router.post("/sign-up", validateSignUpFields, signUpController);
router.post("/sign-in", validateSignInFields, signInController);

export default router;
