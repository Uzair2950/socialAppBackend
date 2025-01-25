import { parseDateSheet, parseTimetable } from "./xlparser.js";
import { connectDB } from "./database/db.js";
import { getCourseIdByCode } from "./utils/utils.js";
import {
  Courses,
  Enrollment,
  Students,
  Users,
  Friends,
  VipCollections,
  Communities,
} from "./database/models/models.js";
import studentController from "./controllers/studentController.js";

//
let d = await connectDB();

console.log(JSON.stringify(
  await Communities.findById("675b3f4ff5c5033db709a29a").populate([
    { path: "annoucementGroup", select: "name chat avatarURL" },
    { path: "groups.gid", select: "name title" },
  ]), null, 2)
);

await d.disconnect();
