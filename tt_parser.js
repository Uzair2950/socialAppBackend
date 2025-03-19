import pkg from "xlsx";
const { readFile, utils } = pkg;

import { writeFile } from "fs";
import { Sections, TimeTable } from "./database/models/models.js";
let file = readFile("timetable1.xlsx");
import { connectDB } from "./database/db.js"
import { getCoursesMapping, getCurrentSessionId } from "./utils/utils.js";

let db = await connectDB();
console.log(file.SheetNames);

let sheet = file.Sheets["TimeTable"];

let x = utils.sheet_to_json(sheet, { header: "A", skipHidden: true });

// 9 Slots Each day + (day + section header)

const isDay = (day) =>
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(day);

const groupedByDays = x.reduce(
    (acc, entry) => {
        if (entry["A"] && isDay(entry["A"])) {
            acc.currentDay = entry["A"];
            acc.result[acc.currentDay] = [];
        } else if (acc.currentDay) {
            let values = Object.values(entry);
            acc.result[acc.currentDay].push({
                time: values[0],
                slots: values.slice(1),
            });
        }
        return acc;
    },
    { result: {}, currentDay: null }
).result;

let timetableData = {};

let sectionsData = await Sections.find().select("title _id").then(sections =>
    sections.reduce((acc, section) => {
        acc[section.title] = section._id;
        return acc;
    }, {})
);

let sessionId = await getCurrentSessionId()

console.log(sectionsData)

for (var day in groupedByDays) {
    let daySlot = groupedByDays[day];

    for (var timeSlot of daySlot) {
        let time = timeSlot.time.split("-");
        let slots = timeSlot.slots;
        for (var slot of slots) {
            let slotData = slot.split("_");
            let code = slotData[0].trim().split("-").join("");
            let sections = (slotData[1].match(/\(([^)]+)\)/)[1]).split(",");
            let instructors = slotData[2].match(/\(([^)]+)\)/)[1];
            let venue = slotData[3];


            // Add Sections in timetable if they don't exist.

            await Promise.all(sections.map(async e => {
                if (!timetableData[e]) {
                    timetableData[e] = {
                        session: sessionId,
                        section: sectionsData[e],
                        slots: {
                            monday: [],
                            tuesday: [],
                            wednesday: [],
                            thursday: [],
                            friday: [],
                        }
                    };
                }
                // Push the slot
                timetableData[e].slots[day.toLowerCase()].push({
                    course: code,
                    courseMap: await getCoursesMapping(code),
                    venue: venue,
                    start_time: time[0].trim(),
                    end_time: time[1].trim(),
                    instructors: instructors,
                });
            }))

        }
    }

}

console.log(timetableData)



// writeFile("tt.json", JSON.stringify(Object.values(timetableData), null, 2), (err) => { })
// 
await TimeTable.insertMany(Object.values(timetableData))


await db.disconnect();
