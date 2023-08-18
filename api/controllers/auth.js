import jwt from "jsonwebtoken";
import statusCodes from "../../constants.js";
import { usersCollection } from "../../db/collections.js";
import { hashPassword, validatePassword } from "../../helpers/auth.helper.js";
import { ErrorHandler } from "../../middlewares/error.js";

const { OK, NOT_FOUND, UNAUTHORIZED } = statusCodes;

const SECRET_KEY = process.env.SECRET_JWT_KEY;

const signUpController = async (req, res, next) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    const hashedPassword = await hashPassword(password);

    const fullName = `${firstName} ${lastName}`.trim();

    const userData = {
      email,
      name: fullName,
      password: hashedPassword,
    };

    await usersCollection.insertOne(userData);

    res.status(OK).json({
      message: "You are successfully registered!",
    });
  } catch (e) {
    next(e);
  }
};

const signInController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await usersCollection.findOne({ email });

    if (user) {
      const passwordIsValid = await validatePassword(password, user.password);

      if (passwordIsValid) {
        const token = await jwt.sign(
          { email: user.email, name: user.name, _id: user._id },
          SECRET_KEY
        );

        delete user.password;

        res.status(OK).json({
          message: "You are successfully logged in!",
          user,
          token,
        });
      } else {
        throw new ErrorHandler(UNAUTHORIZED, "Wrong password.");
      }
    } else
      throw new ErrorHandler(NOT_FOUND, "User with this email does not exist.");
  } catch (e) {
    next(e);
  }
};

const getUser = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      res.status(OK).json({
        user: null,
      });
    } else {
      const payload = await jwt.verify(authorization, SECRET_KEY);
      if (payload)
        res.status(OK).json({
          user: payload,
        });
    }
  } catch (e) {
    next(e);
  }
};

export { signUpController, signInController, getUser };
