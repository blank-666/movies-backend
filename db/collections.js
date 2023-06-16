import db from "./connect-mongo.mjs";

export const moviesCollection = db.collection("movies");
export const directorsCollection = db.collection("directors");
