import { Students, TimeTable } from "../database/models/models.js";

export default {
  getTimeTable: async function (uid) {
    let stu_sections = await Students.findOne({ user: uid }).distinct(
      "enrolled_courses.section"
    );

    let timeTable = await TimeTable.find({
      section: { $in: stu_sections },
    }).select("slots").lean();

    return timeTable;
  },
};
