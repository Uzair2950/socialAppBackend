import pkg from "xlsx";
const { readFile, utils } = pkg;

import { getSectionIdByName } from "./utils/utils.js";

const daysMaps = {
  B: "monday",
  C: "tuesday",
  D: "wednesday",
  E: "thursday",
  F: "friday",
};

const parseTimetable = async (filePath) => {
  let file = readFile(filePath);
  let sheet = file.Sheets[file.SheetNames[0]];

  let x = utils.sheet_to_json(sheet, { header: "A" });

  const timetable = [];

  for (let i = 0; i < x.length; i++) {
    let obj = x[i];

    if (!obj["A"]) continue;

    if (obj["A"].includes("Time Table:")) {
      let sectionName = obj["A"].split(":")[1];
      console.log("looking up " + sectionName)
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
          keys.forEach((key) => {
            if (key == "A") return;
            let data = x[j][key].split("_").map((e) => e.trim());
            let time = timeSlot.split("-").map((e) => e.trim());

            slots[daysMaps[key]].push({
              course: `${data[0]} ${data[1]}`,
              venue: data[3],
              start_time: time[0],
              end_time: time[1],
              time: timeSlot,
              instructors: data[2]
                .substring(data[2].indexOf("(") + 1)
                .replace(")", ""),
            });
          });
        }
      }
      i += 10;

      timetable.push({ section: sectionId, slots });
    }
  }
  return timetable;
};

export { parseTimetable };
