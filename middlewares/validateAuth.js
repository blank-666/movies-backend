import jwt from "jsonwebtoken";
import { statusCodes } from "../constants.js";
import { usersCollection } from "../db/collections.js";
import { isEmailValid } from "../helpers/auth.helper.js";
import { ErrorHandler } from "./error.js";

const { INVALID_DATA, UNAUTHORIZED } = statusCodes;

const SECRET_KEY = process.env.SECRET_JWT_KEY;

const validateSignUpFields = async (req, res, next) => {
  try {
    const { email, firstName, password, passwordConfirmation } = req.body;

    if (!email || !firstName || !password || !passwordConfirmation)
      throw new ErrorHandler(
        INVALID_DATA,
        "Some required data is not provided!"
      );

    if (!isEmailValid(email))
      throw new ErrorHandler(INVALID_DATA, "The email is not valid!");

    if (password !== passwordConfirmation)
      throw new ErrorHandler(
        INVALID_DATA,
        "The confirmation password that you entered do not match!"
      );

    const activeEmailsList = await usersCollection.distinct("email");

    if (activeEmailsList.some((activeEmail) => activeEmail === email))
      throw new ErrorHandler(
        INVALID_DATA,
        "User with this email is already exist!"
      );

    next();
  } catch (e) {
    next(e);
  }
};

const validateSignInFields = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      throw new ErrorHandler(
        INVALID_DATA,
        "Some required data is not provided!"
      );

    next();
  } catch (e) {
    next(e);
  }
};

const checkAuthorization = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      throw new ErrorHandler(
        UNAUTHORIZED,
        "Only authorized users can perform this operation."
      );
    }

    const payload = await jwt.verify(authorization, SECRET_KEY);
    if (payload) req.user = payload;
    else {
      throw new ErrorHandler(
        UNAUTHORIZED,
        "Only authorized users can perform this operation."
      );
    }

    next();
  } catch (e) {
    next(e);
  }
};

export { validateSignUpFields, validateSignInFields, checkAuthorization };
