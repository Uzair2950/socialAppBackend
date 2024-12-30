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
  Messages,
  Sections,
} from "./database/models/models.js";
import postgroupController from "./controllers/postgroupController.js";
import { getCurrentSession, getStudentSections } from "./utils/utils.js";
import postController from "./controllers/postController.js";
import chatController from "./controllers/chatController.js";

import { getNewMessageCount } from "./utils/utils.js";
import { parseTimetable } from "./xlparser.js";

let db = await connectDB();

let tbw = "675736d0c90ab67482af2162";
let map = "675736d0c90ab67482af215c";
let toq3 = "675736d0c90ab67482af2173";
let cc = "675736d0c90ab67482af2155";

let myId = "6754a9268db89992d5b8221e";
let id2 = "6754a9268db89992d5b8221f";
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

// let chats = await Users.findOne().populate('activeChats')

// console.log(await chats.activeChats[0].getChatHead(myId).populate('chatInfo'))

// let msg = new Messages({
//   senderId: myId,
//   content: "🤣",
// });
// await Chats.findByIdAndUpdate("675c95af52ec11f80a0b8a0c", {
//   $addToSet: { messages: msg },
// });

// let c = await Chats.findOne()
// c.messages.addToSet()

// console.log()

// console.log((await Messages.findOne()))

// let chat = await Chats.findById("675c95af52ec11f80a0b8a0c")
//   .select("messages")
//   .populate({
//     path: "messages",
//     select: "content attachment readBy senderId isRead",
//     options: { virtuals: true },
//   });

// console.log(chat);
// let uid = "6754a9268db89992d5b8221e";
// let userChats = await Users.findById(uid)
//   .select("activeChats groupChats")
//   .populate([
//     {
//       path: "activeChats",
//       select: "participants messages.0 totalParticipants",
//       options: { sort: { updatedAt: -1 } },
//       populate: [
//         {
//           path: "participants",
//           select: "name avatarURL",
//           match: { _id: { $ne: uid } }, // Gets the "other" user
//         },
//         {
//           path: "messages",
//           select: "content senderId createdAt -_id",
//           options: { $slice: -1 },
//         },
//       ],
//     },
//     {
//       path: "groupChats",
//       select: "name avatarURL chat",
//       populate: {
//         path: "chat",
//         select: "type",
//         populate: {
//           path: "messages",
//           select: "content senderId createdAt -_id",
//         },
//       },
//     },
//   ]);

// let c = await Chats.findById("675c95af52ec11f80a0b8a0c")
//   .select("messages")
//   .populate({
//     path: "messages",
//     options: { $slice: -1 },
//   });
// let userDetails = await Users.findById("6754a9268db89992d5b8221e")
//   .select("activeChats groupChats -_id")
//   .populate({
//     path: "groupChats",
//     select: "chat name avatarURL",
//   });

// let groupChats = userDetails.groupChats.map((e) => e.chat);
// // console.log(userDetails);
// let chats = await Chats.find(
//   { _id: [...groupChats, ...userDetails.activeChats] },
//   {
//     isGroup: 1,
//     totalParticipants: 1,
//     participants: {
//       $elemMatch: { $ne: "6754a9268db89992d5b8221e" },
//     },
//     messages: { $slice: -1 },
//   },
//   { sort: { updatedAt: -1 } }
// ).populate([
//   {
//     path: "messages",
//     select: "content senderId createdAt -_id",
//   },
//   {
//     path: "participants",
//     select: "name avatarURL",
//   },
// ]);

// let transformedChats = await Promise.all(
//   chats.map(async (e) => {
//     let chatInfo = {
//       _id: e.participants[0]._id,
//       name: e.participants[0].name,
//       avatarURL: e.participants[0].avatarURL,
//     };
//     if (e.isGroup) {
//       console.log("is group")
//       let chatGroupDetails = userDetails.groupChats.filter((i) => i.chat.toString() == e._id.toString())[0];
//       chatInfo = {
//         _id: chatGroupDetails._id,
//         name: chatGroupDetails.name,
//         avatarURL: chatGroupDetails.avatarURL,
//       };
//     }

//     return {
//       id: e._id,
//       chatInfo,
//       totalParticipants: e.totalParticipants,
//       isGroup: e.isGroup,
//       lastMessage: e.messages[0] ?? {
//         senderId: "",
//         content: "",
//         createdAt: "",
//       },
//       newMessageCount: await getNewMessageCount(
//         e.messages[0],
//         "6754a9268db89992d5b8221e",
//         e._id
//       ),
//     };
//   })
// );



await Users.insertMany([
  {
    name: "Uzair ibn e Irfan",
    email: "2021-ARID-4623@biit.edu.pk",
    password: "123",
    avatarURL: "/static/avatars/default_avatar.png"
  },
  {
    name: " Uzair Muhammad",
    email: "2021-ARID-4624@biit.edu.pk",
    password: "123",
    avatarURL: "/static/avatars/default_avatar.png"
  }
])

db.disconnect();
