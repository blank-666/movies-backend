import cloudinary from "cloudinary";
import { moviesCollection } from "../db/collections.js";
import { convertId } from "./convert.js";

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

  return { url: res.secure_url, public_id: res.public_id };
};

const getPublicId = async (documentId) => {
  const { public_id } = await moviesCollection.findOne(
    { _id: convertId(documentId) },
    {
      projection: {
        public_id: "$poster.public_id",
        _id: 0,
      },
    }
  );
  return public_id;
};

const deletePosterByMovieId = async (movieId) => {
  const publicId = await getPublicId(movieId);
  await cloudinary.uploader.destroy(publicId);
};

export { uploadFile, deletePosterByMovieId };
