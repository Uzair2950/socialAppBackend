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

let user = await Users.findOne();
let user2 = await Users.findById("6717f80795440ca739961caa");

let comment = new Comments({
  author: user._id,
  content: "Congrats",
});

let comment2 = new Comments({
  author: user2._id,
  content: "Wow, !!",
});

let comment3 = new Comments({
  author: user._id,
  content: "Congrats r3rf",
});

let comment4 = new Comments({
  author: user._id,
  content: "rdsgfdgfdhfg",
});

await comment.save();
await comment2.save();
await comment3.save();
await comment4.save();

let post = new Posts({
  author: user._id,
  content: "Alhamdulillah, Engaged! 😁",
  attachements: [
    "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_640.jpg",
  ],
  comments: [comment._id, comment2._id],
});

await post.save();

let post2 = new Posts({
  // group post
  author: user2._id,
  content: "WOw",
  comments: [comment3._id, comment4._id],
});

await post.save();
await post2.save();

let post_Group = new PostGroups({
  title: "Just another group!",
  posts: [post2._id],
});

await post_Group.save();

let group_members = new GroupMembers({
  uid: user._id,
  gid: post_Group._id,
});

let group_members2 = new GroupMembers({
  uid: user2._id,
  gid: post_Group._id,
});


await group_members.save();
await group_members2.save();

let message1 = new Messages({
  senderId: user._id,
  content: "Hi",
  isReply: false,
  readBy: [user._id],
  reply: {},
  attachements: ["6717f80795440ca739961caa"],
});

let message2 = new Messages({
  senderId: user2._id,
  content: "Hello ",
  isReply: false,
  readBy: [user2._id],
  reply: {},
  attachements: ["6717f80795440ca739961caa"],
});

await message1.save();
await message2.save();

let chat = new Chats({
  participants: [user._id, user2._id],
  messages: [message1._id, message2._id],
});

await chat.save();

//

user.friends.addToSet(new Friends({ friend_id: "6717f80795440ca739961caa" }));

await user.save();

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

connection.disconnect();
