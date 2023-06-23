import { ObjectId } from "mongodb";

export const convertFilterObject = (filter) => {
  const filterObject = {};

  if (!filter) return filterObject;
  const filterKeys = Object.keys(filter);

  filterKeys.forEach((key) => {
    const filterValuesByKey = filter[key].split(",");
    filterObject[key] = {
      $in: filterValuesByKey,
    };
  });

  return {
    $match: filterObject,
  };
};

export const convertSortObject = (sort) => {
  const sortField = Object.keys(sort)[0];
  const order = sort[sortField] === "ascend" ? 1 : -1;

  return {
    $sort: { [sortField]: order },
  };
};

export const convertSearchObject = (search) => {
  const searchFields = Object.keys(search);

  const searchObjects = searchFields.map((field) => ({
    text: {
      query: search[field],
      path: field,
    },
  }));

  return {
    $search: {
      compound: {
        must: searchObjects,
      },
    },
  };
};

export const convertWithTotal = (limit, offset) => {
  return {
    $facet: {
      total: [{ $count: "count" }],
      rows: [
        { $match: {} },
        { $skip: (offset - 1) * limit },
        {
          $limit: +limit,
        },
      ],
    },
  };
};

export const convertToArray = (string) => string.split(",");

export const convertIds = (ids) => {
  const idsArray = typeof ids === "string" ? ids.split(",") : ids;

  return idsArray.map((id) => new ObjectId(id));
};

export const convertId = (id) => new ObjectId(id);
