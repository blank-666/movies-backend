import { emailTemplates } from "../../constants.js";
import accountActivationEmail from "./templates/account-activation.email.js";

const { ACCOUNT_ACTIVATION } = emailTemplates;

const buildEmail = (templateName, data, mail_to) => {
  const defaultParams = {
    mail_to,
    mail_from: process.env.GOOGLE_USER,
  };

  switch (templateName) {
    case ACCOUNT_ACTIVATION:
      return accountActivationEmail(
        {
          ...defaultParams,
          subject: "Account Activation",
        },
        data
      );

    default:
      return "";
  }
};

export default buildEmail;
