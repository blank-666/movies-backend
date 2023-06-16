import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.ATLAS_URI || "";

export const client = new MongoClient(connectionString, {
  serverApi: {
    version: ServerApiVersion.v1,
    // strict: true,
    deprecationErrors: true,
  },
});

let conn;

const connectToMongoDataBase = async () => {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    conn = await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } catch (err) {
    console.error("Error connecting to the MongoDB!", err);
  }
};

try {
  await connectToMongoDataBase();
  const { databases } = await client.db().admin().listDatabases();
  databases.forEach((db) => console.log(" - ", db.name));
} catch (err) {
  console.error("Error connecting to the MongoDB!", err);
}
// finally {
//   await client.close();
// }

let db = await conn.db("sample_mflix");

export const moviesCollection = db.collection("movies");

export default db;
