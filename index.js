import { connectDB } from "./database/db.js";
import { Types } from "mongoose";
import {
  Users, // ✅
  Friends, // ✅
  Courses, // ✅
  Sections, // ✅
  Teachers, // ✅
  Students, // ✅
  Messages,
  Comments, // ✅
  Posts, // ✅
  PostGroups, // ✅
  Chats,
  ChatGroups,
  GroupMembers, // ✅
  Communities,
  CommunityMembers,
} from "./database/models/models.js";

let connection = await connectDB();

// Users
// await Users.insertMany([
//   {
//     username: "cyber",
//     password: "212",
//     name: "Syed Shah Meer Haider",
//   },
//   {
//     username: "epsilon",
//     password: "212",
//     name: "Hassan Shahzad",
//   },
//   {
//     username: "theta",
//     password: "212",
//     name: "Ch. Attique",
//   },
//   {
//     username: "eta",
//     password: "212",
//     name: "Abdul Rafe",
//   },
//   {
//     username: "beta",
//     password: "212",
//     name: "Muhammad Abdullah",
//   },
//   {
//     username: "shahid",
//     password: "212",
//     name: "Shahid Jamil",
//   },
//   {
//     username: "zahid",
//     password: "212",
//     name: "Zahid",
//   },

// ]);

let user1 = await Users.findOne()
let user2 = await Users.findById('6718996d858731ebee090546')


// let _chat = new Chats({
//   participants: [user1._id, user2._id],
// })


// user1.activeChats.push(_chat._id)
// user2.activeChats.push(_chat._id)

// await _chat.save();
// await user1.save();
// await user2.save();

// let sendMessage = async(senderId, chatId, content) => {
//   let chat = await Chats.findById(chatId);
//   let message = new Messages({
//     content,
//     senderId,
//   })
//   await message.save();
//   chat.messages.push(message);

//   await chat.save();

// };

let chat = await Chats.findById('67189d68adbe4c6469fa4e8f').populate([
  {
    path: 'participants',
    select: '_id name avatarURL',
  },
  {
    path: 'messages',
    select: '-_id content senderId',
  }
])
console.log(chat.getChatHead('6718996d858731ebee090545'))





// sections
// await Sections.insertMany([
//   { title: "GC-7C" },
//   { title: "GC-7A" },
//   { title: "GC-7B" },
//   { title: "AI-7A" },
// ]);

// await Students.insertMany([
//   {r}
// ])

// let user = await Users.findOne();
// let user2 = await Users.findById("6717f80795440ca739961caa");

// let comment = new Comments({
//   author: user._id,
//   content: "Congrats",
// });

// let comment2 = new Comments({
//   author: user2._id,
//   content: "Wow, !!",
// });

// let comment3 = new Comments({
//   author: user._id,
//   content: "Congrats r3rf",
// });

// let comment4 = new Comments({
//   author: user._id,
//   content: "rdsgfdgfdhfg",
// });

// await comment.save();
// await comment2.save();
// await comment3.save();
// await comment4.save();

// let post = new Posts({
//   author: user._id,
//   content: "Alhamdulillah, Engaged! 😁",
//   attachements: [
//     "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_640.jpg",
//   ],
//   comments: [comment._id, comment2._id],
// });

// await post.save();

// let post2 = new Posts({
//   // group post
//   author: user2._id,
//   content: "WOw",
//   comments: [comment3._id, comment4._id],
// });

// await post.save();
// await post2.save();

// let post_Group = new PostGroups({
//   title: "Just another group!",
//   posts: [post2._id],
// });

// await post_Group.save();

// let group_members = new GroupMembers({
//   uid: user._id,
//   gid: post_Group._id,
// });

// let group_members2 = new GroupMembers({
//   uid: user2._id,
//   gid: post_Group._id,
// });

// await group_members.save();
// await group_members2.save();

// let message1 = new Messages({
//   senderId: user._id,
//   content: "Hi",
//   isReply: false,
//   readBy: [user._id],
//   reply: {},
//   attachements: ["6717f80795440ca739961caa"],
// });

// let message2 = new Messages({
//   senderId: user2._id,
//   content: "Hello ",
//   isReply: false,
//   readBy: [user2._id],
//   reply: {},
//   attachements: ["6717f80795440ca739961caa"],
// });

// await message1.save();
// await message2.save();

// let chat = new Chats({
//   participants: [user._id, user2._id],
//   messages: [message1._id, message2._id],
// });

// await chat.save();

// //

// user.friends.addToSet(new Friends({ friend_id: "6717f80795440ca739961caa" }));

// await user.save();

// let teacher = await Users.create({
//   username: "epsilon",
//   password: "123",
//   name: "Wow",
//   avatarURL: "https://localhost:100",
//   bio: "",
// });

// await Teachers.create({
//   user: teacher._id,
// });

// await Students.create({
//   section: "6717df96500e5c5b122b2672",
//   user: "6717f6e059df07b266e7eebd",
// });

// await Courses.insertMany([
//   { "code": "CSC-101", "title": "Programming Fundamentals", "creditHours": 4 },
//   { "code": "CSC-102", "title": "Object Oriented Programming", "creditHours": 4 },
//   { "code": "CSC-103", "title": "Database Systems", "creditHours": 4 },
//   { "code": "CSC-111", "title": "Digital Logic Design", "creditHours": 4 },
//   { "code": "CSC-201", "title": "Data Structures", "creditHours": 4 },
//   { "code": "CSC-203", "title": "Artificial Intelligence", "creditHours": 4 },
//   { "code": "CSC-211", "title": "Computer Organization & Assembly Language", "creditHours": 4 },
//   { "code": "CSC-251", "title": "Web Technologies", "creditHours": 3 },
//   { "code": "CSC-351", "title": "Web Engineering", "creditHours": 3 },
//   { "code": "CSC-352", "title": "Visual Programming", "creditHours": 3 },
//   { "code": "CSC-542", "title": "Analysis of Algorithm", "creditHours": 3 },
//   { "code": "CSC-577", "title": "Computer Networks", "creditHours": 4 },
//   { "code": "CSC-582", "title": "Operating Systems", "creditHours": 4 },
//   { "code": "ELE-401", "title": "Basic Electronics", "creditHours": 3 }
// ])

connection.disconnect();
