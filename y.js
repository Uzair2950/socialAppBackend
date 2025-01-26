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
  ScheduledMessages,
} from "./database/models/models.js";
import studentController from "./controllers/studentController.js";

//

let d = await connectDB();
// let dx = new Date();
// await ScheduledMessages.insertMany([
//   {
//     chat: ["675b1c2481388a38bb8ca8cb"],
//     message: "6765a73024029a0c76c9a8ac",
//     pushTime: dx.setMinutes(dx.getMinutes() + 3),
//   },
// ]);


const date = new Date();

console.log(date.setMinutes(date.getMinutes() + 5))
// console.log(
//   await ScheduledMessages.find({
//     pushTime: { $lte: date },
//   })
// );


await d.disconnect();
