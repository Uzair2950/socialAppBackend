import { connectDB } from "./database/db.js";
import { Types } from "mongoose";
import {
  Users,
  Friends,
  Courses,
  Sections,
  Teachers,
  Students,
  Messages,
  Comments,
  Posts,
  PostGroups,
  Chats,
  ChatGroups,
  GroupMembers,
  Communities,
  CommunityMembers,
  Notifications,
  Stories,
  Sessions,
  TimeTable,
} from "./database/models/models.js";

let connection = await connectDB();

let stu_sections = await Students.findOne().distinct(
  "enrolled_courses.section"
);

let timeTable = await TimeTable.find({ section: { $in: stu_sections } }).select(
  "slots"
);

console.log(timeTable[0].slots)
console.log(timeTable[1].slots)


connection.disconnect();
