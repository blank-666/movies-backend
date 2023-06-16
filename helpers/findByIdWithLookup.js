import { ErrorHandler } from "../middlewares/error.js";
import statusCodes from "../constants.js";
import db from "../db/connect-mongo.mjs";
import { convertId } from "./convert.js";
const { NOT_FOUND } = statusCodes;

/**
 * findWithLookup
 * @param {string} id - id for filter
 * @param {string} searchCollection - searchable collection
 * @param {string} lookupCollection - collection from which we extract data
 * @param {string} field - field with references
 * @param {string} lookupField - fields that we extract from the document by reference
 * @returns {Promise<object[]>}
 */
const findByIdWithLookup = async (
  id,
  searchCollection,
  lookupCollection,
  field,
  lookupField
) => {
  const collection = db.collection(searchCollection);
  const lookupResultField = lookupCollection;
  const temporaryField = `${lookupResultField}_docs`;

  if (!collection) throw new ErrorHandler(NOT_FOUND, "Collection not found.");

  const stages = [
    { $match: { _id: convertId(id) } },
    {
      $lookup: {
        from: lookupCollection,
        localField: field,
        foreignField: "_id",
        as: temporaryField,
      },
    },
    {
      $addFields: {
        [lookupResultField]: `$${temporaryField}.${lookupField}`,
      },
    },
    {
      $project: {
        [temporaryField]: 0,
        [field]: 0,
      },
    },
  ];

  const result = await db
    .collection(searchCollection)
    .aggregate(stages)
    .toArray();

  return result[0];
};

export default findByIdWithLookup;
