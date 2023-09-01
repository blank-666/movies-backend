import { statusCodes } from "../constants.js";

const { SERVER_ERROR } = statusCodes;

export class ErrorHandler extends Error {
  constructor(httpCode, message) {
    super();
    this.httpCode = httpCode;
    this.message = message;
  }
}

export const handleErrorMw = (err, req, res) => {
  const { httpCode, message } = err;

  console.log("#################");
  console.error(err);
  console.log("#################");

  if (!httpCode) {
    return res.status(SERVER_ERROR).json({
      status: "error",
      httpCode: SERVER_ERROR,
      message: `Something went wrong ${message || err}`,
    });
  }
  return res.status(httpCode).json({
    status: "error",
    httpCode,
    message: message,
  });
};
