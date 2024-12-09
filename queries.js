// Find Distinct Sections of user and timetable...
let stu_sections = await Students.findOne().distinct(
  "enrolled_courses.section"
);

let timeTable = await TimeTable.find({ section: { $in: stu_sections } }).select(
  "slots"
);
