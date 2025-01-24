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

const fullDayMap = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};

const parseDateSheet = async (filePath) => {
  try {
    let file = readFile(filePath); // TODO: Add the dot.
    let session = (await getCurrentSession())._id;
    let sheetNames = file.SheetNames;
    const codeRegex = /\b[A-Z]{2,3}-?\d{3}\b/;
    let dateSheet = [];
    for (let i = 0; i < /*sheetNames.length*/ 1; i++) {
      let currSheet = sheetNames[i];

      let x = utils.sheet_to_json(file.Sheets[currSheet], { header: "A" });

      let examType = x[1]["A"].trim().split(" ")[0];
      let time = x[2]["A"].trim();
      console.log(time);
      console.log(examType);

      // Datehseet starts from index 5

      for (let j = 5; j < x.length; j++) {
        /*
        {
            A: 'Sat',
            B: '06-07-2024',
            C: 'MTH-001                            Pre-Calculus-1                                                                                                                                                                                                                                                                                                                     (Only for Pre-Medical)',
            D: 'MTH-001                            Pre-Calculus-1                                                                                                                                                                                                                                                                                                                     (Only for Pre-Medical)',
            H: 'CSC-205            Software Engineering',
            I: 'CSC-205            Software Engineering',
            K: 'CAI-262\nMachine Learning',
            L: 'CSE-324\nSoftware Requirement Engineering',
            M: 'CS-453           Software Engineering',
            N: 'CS-453           Software Engineering',
            P: 'CS-515\nComputing Vision',
            S: 'ENG-315\nTechnical & Business Writing',
            T: 'CS-452           Software Engineering-I',
            V: ' ELE401\nBasic Electronics',
            X: 'CS-789                (Network Manage Security'
          }
        */
        let data = x[j];
        let day = data["A"];
        let date = data["B"];

        let keys = Object.keys(data).filter((i) => i != "A" && i != "B");
        console.log(data)
        await Promise.all(
          keys.map(async (key) => {
            const codeMatch = data[key].match(codeRegex);
            if (codeMatch) {
              let code = codeMatch[0].trim();
              // console.log("Current Course Code: " + code)
              let courseId = await getCourseIdByCode(code);
              
              dateSheet.push({
                session,
                type: examType.toLowerCase(),
                course_id: courseId,
                day: day,
                date: date,
              });
            }
          })
        );

      }

      // console.log(x);
    }
    console.log(dateSheet)
  } catch (e) {
    console.log(e);
  }
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
