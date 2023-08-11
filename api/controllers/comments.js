import statusCodes from "../../constants.js";
import { commentsCollection, moviesCollection } from "../../db/collections.js";
import { convertId, convertSortObject } from "../../helpers/convert.js";
import { ErrorHandler } from "../../middlewares/error.js";

const { OK, NOT_FOUND } = statusCodes;

const getCommentsById = async (req, res, next) => {
  try {
    const {
      params: { id },
      query: { sort },
    } = req;

    if (!id) throw new ErrorHandler(NOT_FOUND, "Movie not found.");

    const promises = [];

    promises.push(
      moviesCollection.findOne(
        { _id: convertId(id) },
        { projection: { title: 1, _id: 0 } }
      )
    );

    const stages = [];

    stages.push({
      $match: {
        movie_id: convertId(id),
      },
    });

    if (sort) {
      stages.push(convertSortObject(sort));
    }

    promises.push(commentsCollection.aggregate(stages).toArray());

    const [movie, comments] = await Promise.all(promises);

    if (!movie) throw new ErrorHandler(NOT_FOUND, "Movie not found.");

    res.status(OK).json({
      title: movie.title,
      comments,
    });
  } catch (e) {
    next(e);
  }
};

const createComment = async (req, res, next) => {
  console.log("createComment");
};

export { getCommentsById, createComment };
