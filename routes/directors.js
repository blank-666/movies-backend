import app from "express";
import statusCodes from "../constants.js";
import { directorsCollection } from "../db/collections.js";
import { convertId, convertSearchObject } from "../helpers/convert.js";
import { sortBySearchScore } from "../helpers/sort.js";

const router = app.Router();

const { OK } = statusCodes;

router.get("/", async (req, res, next) => {
  try {
    const { query } = req;

    const { search, limit } = query;

    const stages = [];

    if (limit) {
      stages.push({ $limit: +limit });
    }

    if (search) {
      stages.push(convertSearchObject(search), sortBySearchScore());
    }

    const data = await directorsCollection.aggregate([...stages]).toArray();

    res.status(OK).json({ data });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      body: { name },
    } = req;

    const data = await directorsCollection.insertOne({ name });

    const { insertedId } = data;

    const createdItem = await directorsCollection.findOne({
      _id: convertId(insertedId),
    });

    res.status(OK).json({
      message: "Director was successfully created.",
      item: createdItem,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
