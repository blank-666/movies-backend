import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const sqlDb = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: "movies",
});

try {
  console.log("Connected to mysql database");
} catch (error) {
  console.error("Error connecting to SQL database: ", error);
}

// sqlDb.connect((err) => {
//   if (err) {
//     console.error("Error connecting to SQL database: ", err);
//     return;
//   }
//   console.log("Connected to mysql database");
// });

export default sqlDb;
