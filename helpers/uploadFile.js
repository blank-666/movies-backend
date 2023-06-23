import cloudinary from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
});

const getDataURI = ({ buffer, mimetype }) => {
  const b64 = Buffer.from(buffer).toString("base64");
  return `data:${mimetype};base64,${b64}`;
};

const uploadFile = async (file) => {
  const dataURI = getDataURI(file);
  const res = await cloudinary.uploader.upload(dataURI, {
    resource_type: "auto",
  });

  return res.secure_url;
};

export default uploadFile;
