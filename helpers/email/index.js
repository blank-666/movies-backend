import nodemailer from "nodemailer";
import buildEmail from "./email.build.js";

const sendEmail = async (templateName, data, mailTo) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GOOGLE_USER,
      pass: process.env.GOOGLE_PASSWORD,
    },
  });

  const emailContent = buildEmail(templateName, data, mailTo);

  transporter.sendMail(emailContent, (err, info) => {
    if (err) {
      console.error("Error while send email:", err);
    } else {
      console.log("Email was successfully sent.", info);
    }
  });
};

export default sendEmail;
