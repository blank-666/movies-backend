import app from "express";
import {
  signInController,
  signUpController,
  getUser,
  activateAccount,
} from "../controllers/auth.js";
import {
  validateSignUpFields,
  validateSignInFields,
} from "../../middlewares/validateAuth.js";

const router = app.Router();

router.post("/sign-up", validateSignUpFields, signUpController);
router.post("/sign-in", validateSignInFields, signInController);
router.get("/get-user", getUser);
router.get("/activate/:hash", activateAccount);

export default router;
