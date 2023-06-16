import app from "express";
import statusCodes from "../constants.js";
import { directorsCollection } from "../db/collections.js";
import { convertSearchObject } from "../helpers/convert.js";
import { sortBySearchScore } from "../helpers/sort.js";

const router = app.Router();

const { OK } = statusCodes;

router.get("/", async (req, res, next) => {
  try {
    const { query } = req;

    const { search } = query;

    const stages = [];

    if (search) {
      stages.push(convertSearchObject(search), sortBySearchScore());
    }

    const data = await directorsCollection.aggregate([...stages]).toArray();

    res.status(OK).json({
      data,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
