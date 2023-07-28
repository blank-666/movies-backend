import statusCodes from "../../constants.js";
import { actorsCollection } from "../../db/collections.js";
import { convertId, convertSearchObject } from "../../helpers/convert.js";
import { sortBySearchScore } from "../../helpers/sort.js";

const { OK } = statusCodes;

const getAllActors = async (req, res, next) => {
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

    const data = await actorsCollection.aggregate([...stages]).toArray();

    res.status(OK).json({ data });
  } catch (e) {
    next(e);
  }
};

const createActor = async (req, res, next) => {
  try {
    const {
      body: { name },
    } = req;

    const data = await actorsCollection.insertOne({ name });

    const { insertedId } = data;

    const createdItem = await actorsCollection.findOne({
      _id: convertId(insertedId),
    });

    res.status(OK).json({
      message: "Actor was successfully created.",
      item: createdItem,
    });
  } catch (e) {
    next(e);
  }
};

export { getAllActors, createActor };
