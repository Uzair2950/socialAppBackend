import { connectDB } from "./database/db.js";
import {
  Courses,
  Datesheet,
  Enrollment,
  Posts,
  Sessions,
  Slots,
  Students,
  Teachers,
  TimeTable,
  Users,
  PostGroups,
  GroupMembers,
  Chats,
  Communities,
} from "./database/models/models.js";
import postgroupController from "./controllers/postgroupController.js";
import { getCurrentSession, getStudentSections } from "./utils/utils.js";
import postController from "./controllers/postController.js";

let db = await connectDB();

let tbw = "675736d0c90ab67482af2162";
let map = "675736d0c90ab67482af215c";
let toq3 = "675736d0c90ab67482af2173";
let cc = "675736d0c90ab67482af2155";
// await Slots.insertMany([
//   // 7C
//   // monday
//   {
//     cousre: tbw,
//     instructors: ["67573f6611a71256e4e32d5f"],
//     venue: "LAB-11",
//     start_time: "8:30AM",
//     end_time: "9:30AM",
//   },
//   {
//     cousre: cc,
//     instructors: ["67573f6611a71256e4e32d60"],
//     venue: "LT-2",
//     start_time: "2:00PM",
//     end_time: "3:00PM",
//   },
//   {
//     cousre: cc,
//     instructors: ["67573f6611a71256e4e32d60"],
//     venue: "LAB-7",
//     start_time: "4:00PM",
//     end_time: "5:00PM",
//   },

//   // wednesday
//   {
//     cousre: tbw,
//     instructors: ["67573f6611a71256e4e32d5f"],
//     venue: "LT-2",
//     start_time: "9:30AM",
//     end_time: "10:30AM",
//   },

//   // Thursday
//   {
//     cousre: tbw,
//     instructors: ["67573f6611a71256e4e32d5f"],
//     venue: "LAB-11",
//     start_time: "8:30AM",
//     end_time: "9:30AM",
//   },
//   {
//     cousre: cc,
//     instructors: ["67574c458542cc4835b614cf"],
//     venue: "LAB-9",
//     start_time: "8:30AM",
//     end_time: "9:30AM",
//   },
//   {
//     cousre: toq3,
//     instructors: ["67573f6611a71256e4e32d61"],
//     venue: "LT-12",
//     start_time: "8:30AM",
//     end_time: "9:30AM",
//   },
//   // Friday

//   {
//     cousre: cc,
//     instructors: ["67573f6611a71256e4e32d60"],
//     venue: "LT-7",
//     start_time: "9:30AM",
//     end_time: "10:30AM",
//   },
//   {
//     cousre: cc,
//     instructors: ["67573f6611a71256e4e32d60", "67574c458542cc4835b614cf"],
//     venue: "LAB-8",
//     start_time: "10:30AM",
//     end_time: "11:30AM",
//   },
//   // IOS SECTION
//   // Monday
//   {
//     cousre: map,
//     instructors: ["67573f6611a71256e4e32d66"],
//     venue: "LAB-9",
//     start_time: "5:00PM",
//     end_time: "6:00PM",
//   },
//   // Wedensday
//   {
//     cousre: map,
//     instructors: ["6754a9268db89992d5b82224"],
//     venue: "LAB-3",
//     start_time: "4:00PM",
//     end_time: "5:00PM",
//   },
//   {
//     cousre: map,
//     instructors: ["6754a9268db89992d5b82224"],
//     venue: "LAB-3",
//     start_time: "5:00PM",
//     end_time: "6:00PM",
//   },

//   // Friday
//   {
//     cousre: map,
//     instructors: ["6754a9268db89992d5b82224"],
//     venue: "LAB-3",
//     start_time: "11:30AM",
//     end_time: "12:30PM",
//   },
//   {
//     cousre: map,
//     instructors: ["6754a9268db89992d5b82224", "67573f6611a71256e4e32d66"],
//     venue: "LAB-3",
//     start_time: "12:30PM",
//     end_time: "1:30PM",
//   },
// ]);

// await TimeTable.insertMany([
//   {
//     section: "671fca9828d6e955a5ecdbb0", // 7C
//     slots: {
//       monday: [
//         "67574e9993bed7e59c4d9f4d",
//         "67574e9993bed7e59c4d9f4e",
//         "67574e9993bed7e59c4d9f4f",
//       ],
//       wednesday: ["67574e9993bed7e59c4d9f50"],
//       thursday: [
//         "67574e9993bed7e59c4d9f51",
//         "67574e9993bed7e59c4d9f52",
//         "67574e9993bed7e59c4d9f53",
//       ],
//       friday: ["67574e9993bed7e59c4d9f54", "67574e9993bed7e59c4d9f55"],
//     },
//   },
//   {
//     section: "671fca9828d6e955a5ecdbb4", // IOS
//     slots: {
//       monday: ["67574e9993bed7e59c4d9f56"],
//       wednesday: ["67574e9993bed7e59c4d9f57", "67574e9993bed7e59c4d9f58"],
//       friday: ["67574e9993bed7e59c4d9f59", "67574e9993bed7e59c4d9f5a"],
//     },
//   },
// ]);

// let enrollments = await Enrollment.find({session: ""})

// console.log(await getStudentSections("6754a9268db89992d5b8221e"))

// let group = await PostGroups.findById(gId);
// console.log(await postgroupController.getGroup('67589273249c63d277b41a53', '6754a9268db89992d5b82222'));

let groupMembers = await postgroupController.getGroupMembers(
  "67589273249c63d277b41a53"
);

// let x  = (await Users.find().select('_id')).map(e => e._id.toString())

// console.log(x)

// await Users.updateMany(
//   { _id: { $in: groupMembers } },
//   { $push: { groupChats: gid } }
// );


let y = `"members": [
      '6754a9268db89992d5b8221f',
  '6754a9268db89992d5b82220',
  '6754a9268db89992d5b82221',
  '6754a9268db89992d5b82222',
  '6754a9268db89992d5b82223',
  '6754a9268db89992d5b82224',
  '6754a9268db89992d5b82225',
  '67573f6611a71256e4e32d5f',
  '67573f6611a71256e4e32d60',
  '67573f6611a71256e4e32d61',
  '67573f6611a71256e4e32d62',
  '67573f6611a71256e4e32d63',
  '67573f6611a71256e4e32d64',
  '67573f6611a71256e4e32d65',
  '67573f6611a71256e4e32d66',
  '67573f6611a71256e4e32d67',
  '67573f6611a71256e4e32d68',
  '67574c458542cc4835b614cf'
   ]`

   console.log(y.replaceAll('\'', "\""))

db.disconnect();

// 00
