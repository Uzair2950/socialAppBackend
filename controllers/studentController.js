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
} from "../utils/utils.js";

export default {
  getTimeTable: async function (uid) {
    const mergedSlots = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
    };

    let sections = await getStudentSections(uid);

    let timeTable = await TimeTable.find({ section: { $in: sections } })
      .select("slots")
      .populate({
        path: "slots.monday slots.thursday slots.wednesday slots.thursday slots.friday",
        options: { sort: { start_time: 1 } },
        populate: [{ path: "course", model: "course", select: "title -_id" }],
      });

    timeTable.forEach((table) => {
      Object.keys(table.slots).forEach((day) => {
        mergedSlots[day] = mergedSlots[day].concat(table.slots[day]);
      });
    });

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

  getClassGroupId: async function (uid) {
    /*
      {
        _id: new ObjectId('6754a9268db89992d5b8221e'),
        type: 'student',
        uid: {
          _id: new ObjectId('6754aa7cb893811aa8ed366d'),
          section: {
            _id: new ObjectId('671fca9828d6e955a5ecdbb0'),
            group: new ObjectId('67940a1800543d3d52eeffbc')
          }
        }
      }
    */
    let student = await Users.findById(uid)
      .select("uid type")
      .populate({
        path: "uid",
        select: "section",
        populate: { path: "section", select: "group" },
      });

    return student.uid.section.group;
  },
};
