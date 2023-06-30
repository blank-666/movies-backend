import app from "express";

import statusCodes from "../constants.js";
import { moviesCollection } from "../db/collections.js";
import {
  convertFilterObject,
  convertId,
  convertIds,
  convertSearchObject,
  convertSortObject,
  convertToArray,
  convertWithTotal,
} from "../helpers/convert.js";
import { sortBySearchScore } from "../helpers/sort.js";
import { ErrorHandler } from "../middlewares/error.js";
import findByIdWithLookup from "../helpers/findByIdWithLookup.js";
import multer from "multer";
import { uploadFile } from "../helpers/cloudinary.helper.js";

const router = app.Router();
const upload = multer();
const { OK, NOT_FOUND } = statusCodes;

router.get("/filters", async (req, res, next) => {
  try {
    const [types, genres] = await Promise.all([
      await moviesCollection.distinct("type"),
      await moviesCollection.distinct("genres"),
    ]);

    res.status(OK).json({
      types,
      genres,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { query } = req;

    const { offset = 1, limit = 10, sort, filter, search } = query;

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

    const movie = await findByIdWithLookup(id, "movies", [
      {
        remoteCollection: "directors",
        newField: "directors",
        originField: "director_ids",
      },
      {
        remoteCollection: "actors",
        newField: "actors",
        originField: "actor_ids",
      },
    ]);

    if (!movie) throw new ErrorHandler(NOT_FOUND, "Movie not found.");

    res.status(OK).json({
      movie: movie,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/", upload.single("poster"), async (req, res, next) => {
  try {
    const { body, file } = req;
    const uploadData = body;

    if (body.actors) uploadData.actor_ids = convertIds(body.actors);
    if (body.directors) uploadData.director_ids = convertIds(body.directors);
    if (body.genres) uploadData.genres = convertToArray(body.genres);

    if (file) {
      const posterUrl = await uploadFile(file);
      uploadData.poster = posterUrl;
    } else uploadData.poster = null;

    const { insertedId } = await moviesCollection.insertOne(uploadData);

    res.status(OK).json({
      id: insertedId,
      message: "Movie was successfully created!",
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

router.put("/:id", upload.single("poster"), async (req, res, next) => {
  try {
    const { params, body, file } = req;
    const { id } = params;
    const { actors, directors, genres, ...rest } = body;

    let changes = {};

    if (actors) changes.actor_ids = convertIds(actors);
    if (directors) changes.director_ids = convertIds(directors);
    if (genres) changes.genres = convertToArray(genres);

    if (file) {
      const posterUrl = await uploadFile(file);
      changes.poster = posterUrl;
    } else {
      if (!rest?.keepPoster) changes.poster = null;
      delete rest.keepPoster;
    }

    changes = { ...changes, ...rest };

    await moviesCollection.updateOne(
      { _id: convertId(id) },
      {
        $set: changes,
      }
    );

    res.status(OK).json({
      message: "Movie has been updated",
      id,
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
      message: `Movie${ids.length > 1 ? "s" : ""} has been deleted`,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
