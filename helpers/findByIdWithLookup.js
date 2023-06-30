import { ErrorHandler } from "../middlewares/error.js";
import statusCodes from "../constants.js";
import db from "../db/connect-mongo.mjs";
import { convertId } from "./convert.js";
const { NOT_FOUND } = statusCodes;

/**
 * findWithLookup
 * @param {string} id - id for filter
 * @param {string} searchCollection - searchable collection
 * @param {Object[]} lookups - lookups configuration
 * @param {string} lookups[].remoteCollection - collection from which we extract data
 * @param {string} lookups[].newField - field into which we extract the data
 * @param {string} lookups[].originField - field with references
 * @returns {Promise<object[]>}
 */
const findByIdWithLookup = async (id, searchCollection, lookups) => {
  const collection = db.collection(searchCollection);

  if (!collection) throw new ErrorHandler(NOT_FOUND, "Collection not found.");

  const lookupStages = [];
  const projectConfig = {};

  for (const lookup of lookups) {
    const { remoteCollection, newField, originField } = lookup;

    lookupStages.push({
      $lookup: {
        from: remoteCollection,
        localField: originField,
        foreignField: "_id",
        as: newField,
      },
    });

    projectConfig[originField] = 0;
  }

  const stages = [
    { $match: { _id: convertId(id) } },
    ...lookupStages,
    { $project: projectConfig },
  ];

  const result = await db
    .collection(searchCollection)
    .aggregate(stages)
    .toArray();

  return result[0];
};

export default findByIdWithLookup;
