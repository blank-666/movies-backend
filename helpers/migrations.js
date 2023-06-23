import { moviesCollection } from "../db/collections.js";
import db from "../db/connect-mongo.mjs";

export const createActorsCollection = async () => {
  const aggregationPipeline = [
    {
      $unwind: "$actors",
    },
    {
      $group: {
        _id: "$actors",
      },
    },
    {
      $project: {
        _id: 0,
        name: "$_id",
      },
    },
  ];

  const aggregationResult = await moviesCollection
    .aggregate(aggregationPipeline)
    .toArray();
  await db.createCollection("actors");
  const actorsCollection = db.collection("actors");
  await actorsCollection.insertMany(aggregationResult);
};

export const replaceActorsProperty = async () => {
  const movieCollection = db.collection("movies");
  const actorsCollection = db.collection("actors");

  const actors = await actorsCollection.find().toArray(); // fetch all actors first
  const actorsByName = actors.reduce((map, actor) => {
    map[actor.name] = actor._id; // create a map of actor name to id
    return map;
  }, {});

  const movies = await movieCollection.find().toArray();
  const bulkWriteOps = [];

  for (let movie of movies) {
    let cast_ids = [];
    if (Array.isArray(movie.cast)) {
      // check if cast is an array
      for (let actorName of movie.cast) {
        if (actorsByName[actorName]) {
          // lookup actor id from the map
          cast_ids.push(actorsByName[actorName]);
        }
      }
      // prepare bulk write operations
      bulkWriteOps.push({
        updateOne: {
          filter: { _id: movie._id },
          update: { $set: { cast_ids: cast_ids } },
        },
      });
    }
  }

  if (bulkWriteOps.length > 0) {
    await movieCollection.bulkWrite(bulkWriteOps); // perform bulk update
  }
};

export const deleteCastFieldFromCollection = async () => {
  await moviesCollection.updateMany(
    {},
    { $unset: { cast: 1 } },
    { multi: true }
  );
};
