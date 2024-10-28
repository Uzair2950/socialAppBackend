import { connectDB } from "./database/db.js";
import { Types } from "mongoose";
import {
  Users,
  Friends,
  Courses,
  Sections,
  Teachers,
  Students,
  Messages,
  Comments,
  Posts,
  PostGroups,
  Chats,
  ChatGroups,
  GroupMembers,
  Communities,
  CommunityMembers,
  Notifications,
  Sessions,
  TimeTable,
} from "./database/models/models.js";

let connection = await connectDB();

let user = await Users.findOne();

let posts = await Posts.find({ author: user._id }).populate('likes', 'name avatarURL');


console.log(posts[0]);

connection.disconnect();
