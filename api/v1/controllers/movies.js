import { statusCodes } from "../../../constants.js";
import {
  commentsCollection,
  moviesCollection,
} from "../../../db/collections.js";
import {
  deletePosterByMovieId,
  uploadFile,
} from "../../../helpers/cloudinary.helper.js";
import {
  convertFilterObject,
  convertId,
  convertIds,
  convertSearchObject,
  convertSortObject,
  convertToArray,
  convertWithTotal,
} from "../../../helpers/convert.js";
import findByIdWithLookup from "../../../helpers/findByIdWithLookup.js";
import { sortBySearchScore } from "../../../helpers/sort.js";
import { ErrorHandler } from "../../../middlewares/error.js";

const { OK, NOT_FOUND } = statusCodes;

const getFilters = async (req, res, next) => {
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
};

const getAllMovies = async (req, res, next) => {
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

    stages.push({
      $addFields: {
        poster: "$poster.url",
      },
    });

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
};

const getMovieById = async (req, res, next) => {
  try {
    const { params } = req;
    const { id } = params;

    const totalComments = await commentsCollection.countDocuments({
      movie_id: convertId(id),
    });

    // movie with 291 comments: 573a1392f29313caabcd9be6

    const movie = await findByIdWithLookup(
      id,
      "movies",
      [
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
      ],
      [
        {
          $addFields: {
            poster: "$poster.url",
            total_comments: totalComments,
          },
        },
      ]
    );

    if (!movie) throw new ErrorHandler(NOT_FOUND, "Movie not found.");

    res.status(OK).json({
      movie: movie,
    });
  } catch (e) {
    next(e);
  }
};

const createMovie = async (req, res, next) => {
  try {
    const { body, file } = req;
    const uploadData = body;

    if (body.actors) uploadData.actor_ids = convertIds(body.actors);
    if (body.directors) uploadData.director_ids = convertIds(body.directors);
    if (body.genres) uploadData.genres = convertToArray(body.genres);

    if (file) {
      const { url, public_id } = await uploadFile(file);
      uploadData.poster = {
        url,
        public_id,
      };
    } else uploadData.poster = null;

    const { insertedId } = await moviesCollection.insertOne(uploadData);

    res.status(OK).json({
      id: insertedId,
      message: "Movie was successfully created!",
    });
  } catch (e) {
    next(e);
  }
};

const toggleFavorites = async (req, res, next) => {
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
};

const updateMovie = async (req, res, next) => {
  try {
    const { params, body, file } = req;
    const { id } = params;
    const { actors, directors, genres, ...rest } = body;

    let changes = {};

    if (actors) changes.actor_ids = convertIds(actors);
    if (directors) changes.director_ids = convertIds(directors);
    if (genres) changes.genres = convertToArray(genres);

    if (file) {
      // update poster image
      await deletePosterByMovieId(id);
      const posterUrl = await uploadFile(file);
      changes.poster = posterUrl;
    } else {
      if (!rest?.keepPoster) {
        // delete poster image
        changes.poster = null;
        await deletePosterByMovieId(id);
      }
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
};

const deleteMovies = async (req, res, next) => {
  try {
    const { ids } = req.body;

    await moviesCollection.deleteMany({ _id: { $in: convertIds(ids) } });

    res.status(OK).json({
      message: `Movie${ids.length > 1 ? "s" : ""} has been deleted`,
    });
  } catch (e) {
    next(e);
  }
};

export {
  getFilters,
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovies,
  toggleFavorites,
};
