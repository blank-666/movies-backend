import app from "express";

const router = app.Router();

import statusCodes from "../constants.js";

import db, { moviesCollection } from "../db/connect-mongo.mjs";
import {
  convertFilterObject,
  convertId,
  convertIds,
  convertSearchObject,
  convertSortObject,
  convertWithTotal,
} from "../helpers/convert.js";
import { sortBySearchScore } from "../helpers/sort.js";
import { ErrorHandler } from "../middlewares/error.js";

const { OK, NOT_FOUND } = statusCodes;

router.get("/filters", async (req, res, next) => {
  try {
    const [types, genres, directors, writers, cast] = await Promise.all([
      await moviesCollection.distinct("type"),
      await moviesCollection.distinct("genres"),
      // await collection.distinct("directors"),
      // await collection.distinct("writers"),
    ]);
    //

    res.status(OK).json({
      types,
      genres,
      directors,
      writers,
      cast,
    });
    res.status(OK);
  } catch (e) {
    next(e);
  }
});

const createDirectorsCollection = async () => {
  console.log("try to create collection");
  const aggregationPipeline = [
    {
      $unwind: "$directors",
    },
    {
      $group: {
        _id: "$directors",
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
  await db.createCollection("directors");
  const directorsCollection = db.collection("directors");
  await directorsCollection.insertMany(aggregationResult);
};

const replaceDirectorsProperty = async () => {
  const movieCollection = db.collection("movies");
  const directorCollection = db.collection("directors");

  const directors = await directorCollection.find().toArray(); // fetch all directors first
  const directorsByName = directors.reduce((map, director) => {
    map[director.name] = director._id; // create a map of director name to id
    return map;
  }, {});

  const movies = await movieCollection.find().toArray();
  const bulkWriteOps = [];

  for (let movie of movies) {
    let director_ids = [];
    if (Array.isArray(movie.directors)) {
      // check if directors is an array
      for (let directorName of movie.directors) {
        if (directorsByName[directorName]) {
          // lookup director id from the map
          director_ids.push(directorsByName[directorName]);
        }
      }
      // prepare bulk write operations
      bulkWriteOps.push({
        updateOne: {
          filter: { _id: movie._id },
          update: { $set: { director_ids: director_ids } },
        },
      });
    }
  }

  if (bulkWriteOps.length > 0) {
    await movieCollection.bulkWrite(bulkWriteOps); // perform bulk update
  }
};

const deleteFirst100Movies = async () => {
  try {
    // Вибираємо перші 100 документів з колекції
    const moviesToDelete = await db
      .collection("movies")
      .find()
      .limit(100)
      .toArray();

    // Видаляємо вибрані документи
    await db
      .collection("movies")
      .deleteMany({ _id: { $in: moviesToDelete.map((movie) => movie._id) } });

    console.log("Перші 100 фільмів були успішно видалені.");
  } catch (error) {
    console.error("Сталася помилка при видаленні фільмів:", error);
  }
};

router.get("/", async (req, res, next) => {
  try {
    const { query } = req;

    const { offset = 1, limit = 10, sort, filter, search } = query;

    // await createDirectorsCollection();
    // await replaceDirectorsProperty();

    const stages = [];

    if (search) {
      stages.push(convertSearchObject(search), sortBySearchScore());
    }

    if (filter) {
      stages.push(convertFilterObject(filter));
    }

    if (sort) {
      stages.push(convertSortObject(sort));
    }

    const data = await moviesCollection
      .aggregate([...stages, convertWithTotal(limit, offset)])
      .toArray();

    const { rows, total: totalData } = data[0];

    const count = totalData?.[0]?.count || 0;

    res.status(OK).json({
      rows,
      total: count,
      page: +offset,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { params } = req;
    const { id } = params;

    const findWithLookup = async (
      id,
      collectionName,
      lookupCollectionName,
      lookupField,
      resultFields
    ) => {
      const collection = db.collection(collectionName);
      const lookupResultField = lookupCollectionName;
      const temporaryField = `${lookupResultField}_docs`;

      // const addFieldsObject = {};

      // resultFields.forEach((field) => {
      //   const fieldName = `${lookupResultField}.${field}`;
      //   addFieldsObject[fieldName] = `$${temporaryField}.${field}`;
      // });

      // console.log("addFieldsObject", addFieldsObject);

      if (!collection)
        throw new ErrorHandler(NOT_FOUND, "Collection not found.");

      const stages = [
        { $match: { _id: convertId(id) } },
        {
          $lookup: {
            from: lookupCollectionName,
            localField: lookupField,
            foreignField: "_id",
            as: temporaryField,
          },
        },
        // {
        //   $addFields: addFieldsObject,
        // },
        {
          $addFields: {
            [lookupResultField]: `$${temporaryField}.name`,
          },
        },
        {
          $project: {
            [temporaryField]: 0,
            [lookupField]: 0,
          },
        },
      ];

      const result = await moviesCollection.aggregate(stages).toArray();

      return result;
    };

    const movie = await findWithLookup(
      id,
      "movies",
      "directors",
      "director_ids",
      ["name", "_id"]
    );

    // const stages = [
    //   { $match: { _id: convertId(id) } },
    //   {
    //     $lookup: {
    //       from: "directors",
    //       localField: "director_ids",
    //       foreignField: "_id",
    //       as: "director_docs",
    //     },
    //   },
    //   {
    //     $addFields: {
    //       directors: "$director_docs.name",
    //     },
    //   },
    //   {
    //     $project: {
    //       director_docs: 0,
    //       director_ids: 0,
    //     },
    //   },
    // ];

    // const movie = await moviesCollection.aggregate(stages).toArray();

    if (!movie.length) throw new ErrorHandler(NOT_FOUND, "Movie not found.");

    res.status(OK).json({
      movie: movie[0],
    });
  } catch (e) {
    next(e);
  }
});

router.put("/toggleFavorites", async (req, res, next) => {
  try {
    const { ids } = req.body;

    await moviesCollection.updateMany({ _id: { $in: convertIds(ids) } }, [
      {
        $set: {
          is_favorite: {
            $not: "$is_favorite",
          },
        },
      },
    ]);

    res.status(OK).json({
      message: "Movies has been updated",
    });
  } catch (e) {
    next(e);
  }
});

router.post("/delete", async (req, res, next) => {
  try {
    const { ids } = req.body;

    await moviesCollection.deleteMany({ _id: { $in: convertIds(ids) } });

    res.status(OK).json({
      message: "Movies has been deleted",
    });
  } catch (e) {
    next(e);
  }
});

export default router;
