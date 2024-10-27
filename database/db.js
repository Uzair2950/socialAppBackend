import { connect } from "mongoose";

const MONGOURL = "mongodb://127.0.0.1:27017/";
const DB_NAME = "testDB";

const connectDB = async () => {
  try {
    console.log("Connected TO DB");
    return await connect(`${MONGOURL}${DB_NAME}`);
  } catch (e) {
    return console.error(e);
  }
};

export { connectDB };
