import { Sessions, Students, Enrollment } from "../database/models/models.js";

const getCurrentSession = async () => {
  return await Sessions.findOne({ has_commenced: false }).lean();
};

const getCurrentSessionId = async() => {
  return (await getCurrentSession())._id;
}

const getStudentSections = async (sid) => {
  return await Enrollment.find({
    student: sid,
    session: (await getCurrentSession())._id,
  }).distinct("section")
};

const convertTo24Hour = (time) => {
  let format = time.slice(time.length - 2);
  time = time.replace(format, "");
  const [hours, minutes] = time.split(":").map(Number);

  let hours24 = format === "PM" ? (hours % 12) + 12 : hours % 12;

  const formattedTime = `${hours24.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;

  return formattedTime;
};

export { getCurrentSession, getStudentSections, getCurrentSessionId };
