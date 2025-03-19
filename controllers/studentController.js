import {
  Datesheet,
  Enrollment,
  TimeTable,
  Users,
} from "../database/models/models.js";
import {
  getCurrentSession,
  getStudentSections,
  getCurrentSessionId,
  intersection,
  sortTimetable
} from "../utils/utils.js";

export default {
  getTimeTable: async function (uid) {
    const mergedSlots = {
      Monday: { slots: [] },
      Tuesday: { slots: [] },
      Wednesday: { slots: [] },
      Thursday: { slots: [] },
      Friday: { slots: [] },
    };

    let sections = await getStudentSections(uid);
    let sectionKeys = {}
    sections.map(e => (sectionKeys = { ...sectionKeys, [e._id]: e.courses }))

    let timetable = await TimeTable.find({
      section: Object.keys(sectionKeys)
    }).populate({
      path: "slots.monday slots.tuesday slots.wednesday slots.thursday slots.friday",
      populate: [{ path: "course", model: "course", select: "title" }],
    }).lean()

    let timetablex = timetable.map(e => {
      return {
        ...e, slots: {
          Monday: e.slots.monday.filter(s => intersection(s.courseMap, sectionKeys[e.section])),
          Tuesday: e.slots.tuesday.filter(s => intersection(s.courseMap, sectionKeys[e.section])),
          Wednesday: e.slots.wednesday.filter(s => intersection(s.courseMap, sectionKeys[e.section])),
          Thursday: e.slots.thursday.filter(s => intersection(s.courseMap, sectionKeys[e.section])),
          Friday: e.slots.friday.filter(s => intersection(s.courseMap, sectionKeys[e.section]))
        }
      }
    })

    timetablex.forEach((table) => {
      Object.keys(table.slots).forEach((day) => {
        mergedSlots[day].slots = mergedSlots[day].slots.concat(table.slots[day]);
      });
    });

    Object.keys(mergedSlots).map(key => {
      mergedSlots[key].slots = sortTimetable(mergedSlots[key].slots);
    })

    return mergedSlots;
  },

  getEnrolledCourses: async function (sid) {
    return await Enrollment.find({
      student: sid,
      session: (await getCurrentSession())._id,
    })
      .select("-_id course")
      .distinct("course");
  },

  // getDateSheet: async function (sid) {
  //   let coursesIds = await this.getEnrolledCourses(sid);
  //   let dateSheet = await Datesheet.find({
  //     session: await getCurrentSessionId(),
  //     commenced: false,
  //     course_id: { $in: coursesIds },
  //   })
  //     .select("type date_time course_id")
  //     .populate("course_id", "title")
  //     .sort({ date_time: 1 });

  //   return dateSheet;
  // },
};
