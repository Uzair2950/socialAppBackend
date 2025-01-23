import { parseDateSheet, parseTimetable } from "./xlparser.js";
import { connectDB } from "./database/db.js";
import { getCourseIdByCode } from "./utils/utils.js";
import { Courses, Enrollment } from "./database/models/models.js";

let d = await connectDB();

await parseDateSheet('datesheet.xls')



// console.log(JSON.stringify(uniqueCourses));

await d.disconnect();
