import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const sqlDb = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  //   database: process.env.MYSQL_DATABASE,
});

sqlDb.connect((err) => {
  if (err) {
    console.error("Error connecting to SQL database: ", err);
    return;
  }
  console.log("Connected to mysql database");
});

export default sqlDb;
