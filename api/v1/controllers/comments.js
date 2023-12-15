import { io } from "../../../bin/www.js";
import { statusCodes } from "../../../constants.js";
import {
  commentsCollection,
  moviesCollection,
  usersCollection,
} from "../../../db/collections.js";
import {
  convertId,
  convertSortObject,
  convertWithTotal,
} from "../../../helpers/convert.js";
import { ErrorHandler } from "../../../middlewares/error.js";

const { OK, NOT_FOUND, INVALID_DATA } = statusCodes;

const getCommentsById = async (req, res, next) => {
  try {
    const {
      params: { id },
      query: { offset = 1, limit = 10, sort },
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

    promises.push(
      commentsCollection
        .aggregate([...stages, convertWithTotal(limit, offset)])
        .toArray()
    );

    const [movie, commentsData] = await Promise.all(promises);

    if (!movie) throw new ErrorHandler(NOT_FOUND, "Movie not found.");

    const { rows, total: totalData } = commentsData[0];

    const count = totalData?.[0]?.count || 0;

    res.status(OK).json({
      title: movie.title,
      rows,
      total: count,
      chunk: +offset,
    });
  } catch (e) {
    next(e);
  }
};

const createComment = async (req, res, next) => {
  try {
    const {
      body: { text, movie_id },
      user,
    } = req;

    if (!text || !movie_id) {
      throw new ErrorHandler(INVALID_DATA, "Required field is missing.");
    }

    const movie = await moviesCollection.findOne({ _id: convertId(movie_id) });

    if (!movie) throw new ErrorHandler(NOT_FOUND, "No such movie.");

    const commentPayload = {
      name: user.name,
      email: user.email,
      movie_id: convertId(movie_id),
      date: new Date(Date.now()),
      text,
    };

    const { insertedId } = await commentsCollection.insertOne(commentPayload);

    if (!insertedId)
      throw new ErrorHandler(SERVER_ERROR, "Something went wrong.");

    const newComment = {
      ...commentPayload,
      _id: insertedId,
    };

    io.emit("new-comment", { data: newComment });

    res.status(OK).json({
      message: "Comment was successfully added!",
      comment: newComment,
    });
  } catch (e) {
    next(e);
  }
};

export { getCommentsById, createComment };
