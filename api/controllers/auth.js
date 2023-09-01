import jwt from "jsonwebtoken";
import { statusCodes, emailTemplates } from "../../constants.js";
import { usersCollection } from "../../db/collections.js";
import { hashPassword, validatePassword } from "../../helpers/auth.helper.js";
import { ErrorHandler } from "../../middlewares/error.js";
import sendEmail from "../../helpers/email/index.js";
import { convertId } from "../../helpers/convert.js";

const { OK, NOT_FOUND, UNAUTHORIZED, INVALID_DATA } = statusCodes;

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
      pending: true,
    };

    const { insertedId } = await usersCollection.insertOne(userData);

    if (!insertedId)
      throw new ErrorHandler(SERVER_ERROR, "Something went wrong.");

    await sendEmail(
      emailTemplates.ACCOUNT_ACTIVATION,
      { hash: insertedId, username: fullName },
      email
    );

    res.status(OK).json({
      message:
        "You are successfully registered! Please check your email to activate your account.",
    });
  } catch (e) {
    next(e);
  }
};

const signInController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await usersCollection.findOne({
      email,
      pending: { $exists: false },
    });

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
        throw new ErrorHandler(UNAUTHORIZED, "Wrong password!");
      }
    } else throw new ErrorHandler(NOT_FOUND, "Invalid credentials!");
  } catch (e) {
    next(e);
  }
};

const activateAccount = async (req, res, next) => {
  try {
    const {
      params: { hash },
    } = req;

    const user = await usersCollection.findOne({ _id: convertId(hash) });

    if (!user) throw new ErrorHandler(NOT_FOUND, "Account does not exist.");
    if (!user?.pending)
      throw new ErrorHandler(
        INVALID_DATA,
        "This account has already been activated."
      );

    await usersCollection.updateOne(
      { _id: convertId(hash) },
      {
        $unset: { pending: "" },
      }
    );

    res.status(OK).json({ message: `User ${hash} has been activated` });
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

export { signUpController, signInController, getUser, activateAccount };
