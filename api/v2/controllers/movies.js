import sqlDb from "../../../db/connect-mysql.js";
import { statusCodes } from "../../../constants.js";

const { OK } = statusCodes;

const getFilters = async (req, res, next) => {
  try {
    const genresQuery = "SELECT DISTINCT name AS genre FROM genres;";
    const typesQuery = "SELECT DISTINCT type FROM movies;";

    const [[genresResult], [typesResult]] = await Promise.all([
      sqlDb.query(genresQuery),
      sqlDb.query(typesQuery),
    ]);

    const resultObject = {
      genres: genresResult.map((row) => row.genre),
      types: typesResult.map((row) => row.type),
    };

    res.status(OK).json(resultObject);
  } catch (e) {
    next(e);
  }
};

const getAllMovies = async (req, res, next) => {
  try {
    const { query } = req;
    const { offset = 1, limit = 10, sort, filter, search } = query;

    let sortQuery = "";
    const whereConditions = [];

    if (sort) {
      const sortField = Object.keys(sort)[0];
      const sortOrder = sort[sortField] === "ascend" ? "ASC" : "DESC";

      sortQuery = `ORDER BY ${sortField} ${sortOrder}`;
    }

    if (filter) {
      Object.keys(filter).forEach((key) => {
        if (key === "genres") {
          const genresArray = filter[key].split(",");
          whereConditions.push(`g.name IN ('${genresArray.join("','")}')`);
        } else if (key === "type") {
          whereConditions.push(`m.type = '${filter.type}'`);
        }
      });
    }

    if (search) {
      Object.keys(search).forEach((key) => {
        whereConditions.push(`m.${key} LIKE '%${search[key]}%'`);
      });
    }

    const whereQuery =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const sqlQuery = `
      SELECT 
        m.*, JSON_ARRAYAGG(g.name) as genres
      FROM movies m
          LEFT JOIN movies_genres mg ON m.id = mg.movie_id
          LEFT JOIN genres g ON mg.genre_id = g.id
      ${whereQuery}
      GROUP BY m.id
      ${sortQuery}
      LIMIT ${(offset - 1) * limit}, ${limit};
    `;

    const [results, countResults] = await Promise.all([
      sqlDb.query(sqlQuery),
      sqlDb.query("SELECT COUNT(*) AS total FROM movies;"),
    ]);

    const total = countResults[0][0].total;

    const response = {
      rows: results[0],
      total,
      page: +offset,
    };

    res.status(OK).json(response);
  } catch (e) {
    next(e);
  }
};

export { getAllMovies, getFilters };
