import pkg from "xlsx";
const { readFile, utils } = pkg;

import {
  getCourseIdByCode,
  getCurrentSession,
  getSectionIdByName,
} from "./utils/utils.js";

const daysMaps = {
  B: "monday",
  C: "tuesday",
  D: "wednesday",
  E: "thursday",
  F: "friday",
};

const parseDateSheet = async (filePath) => {
  try {
    let file = readFile(filePath); // TODO: Add the dot.
    let sheetNames = file.SheetNames;
    for (let i = 0; i < /*sheetNames.length*/ 1; i++) {
      let currSheet = sheetNames[i];

      let x = utils.sheet_to_json(file.Sheets[currSheet], { header: "A" });

      console.log(x);
    }
  } catch {}
};

const parseTimetable = async (filePath) => {
  try {
    let currentSession = (await getCurrentSession())._id;
    let file = readFile("." + filePath);
    let sheet = file.Sheets[file.SheetNames[0]];

    let x = utils.sheet_to_json(sheet, { header: "A" });

    const timetable = [];
    let courseCodes = [];
    for (let i = 0; i < x.length; i++) {
      let obj = x[i];

      if (!obj["A"]) continue;

      if (obj["A"].includes("Time Table:")) {
        a;
        let sectionName = obj["A"].split(":")[1];
        let sectionId = await getSectionIdByName(sectionName);
        let slots = {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
        };

        // 10 because of 9 slots and one days Object
        for (let j = i + 1; j <= i + 10; j++) {
          let timeSlot = x[j]["A"];
          if (
            timeSlot &&
            timeSlot.match(
              /\b(?:[1-9]|1[0-2]):[0-5][0-9]\s*-\s*(?:[1-9]|1[0-2]):[0-5][0-9]\b/
            ) &&
            Object.keys(timeSlot).length > 1
          ) {
            let keys = Object.keys(x[j]);
            await Promise.all(
              keys.map(async (key) => {
                if (key == "A") return;
                let data = x[j][key].split("_").map((e) => e.trim());
                let time = timeSlot.split("-").map((e) => e.trim());

                let courseId = await getCourseIdByCode(data[0].trim());
                slots[daysMaps[key]].push({
                  course: courseId,
                  venue: data[3],
                  start_time: time[0],
                  end_time: time[1],
                  time: timeSlot,
                  instructors: data[2]
                    .substring(data[2].indexOf("(") + 1)
                    .replace(")", ""),
                });
              })
            );
          }
        }
        i += 10;

        timetable.push({ session: currentSession, section: sectionId, slots });
      }
    }
    console.log(JSON.stringify(courseCodes));
    return timetable;
  } catch (err) {
    console.log(err);
    return;
  }
};

export { parseTimetable, parseDateSheet };
