import { model, Types, Schema } from "mongoose";
import postController from "./controllers/postController.js";
import { connectDB } from "./database/db.js";
import {
  Chats,
  Courses,
  Courses2,
  Enrollment,
  PostGroups,
  PostInteraction,
  Posts,
} from "./database/models/models.js";

let myId = "6754a9268db89992d5b8221e";
let bitId = "6797ebcc37200dbcdec36ba9";
let db = await connectDB();

let chatId = "6797d748a488f06816b02dc0";

let courses = await Courses.find().select("-_id code title");

let courses2 = courses.map((e) => ({ _id: e.code, title: e.title }));

await Courses2.insertMany(courses2);

await db.disconnect();
