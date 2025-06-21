import { Types } from "mongoose";

import {
  Sessions,
  Chats,
  Enrollment,
  Sections,
  AutoReply,
  Messages,
  VipCollections,
  Users,
  Courses,
  Friends,
  PostInteraction,
  CourseMap,
  ChatSettings,
  ChatGroups,
  PostGroups,
  GroupRequests,
} from "../database/models/models.js";

import chatController from "../controllers/chatController.js";

const getCurrentSession = async () => {
  return await Sessions.findOne({ has_commenced: false }).lean();
};

const getCurrentSessionId = async () => {
  return (await getCurrentSession())._id;
};

const intersection = (arr1, arr2) =>
  arr1.filter((item) => arr2.includes(item)).length > 0;
const getStudentSections = async (sid) => {
  return await Enrollment.aggregate([
    {
      $match: {
        $and: [
          { session: (await getCurrentSession())._id },
          { student: new Types.ObjectId(sid) },
        ],
      },
    },
    {
      $group: { _id: "$section", courses: { $addToSet: "$course" } },
    },
  ]);
};

const getCourseIdByCode = async (courseCode) => {
  let code = courseCode.split("-").join(""); // Remove Hyphen
  console.log("Checking Code: " + code);
  // Assuming courseCode is always found
  let courseId = await Courses.findOne({ code }).select("_id").lean();

  return courseId._id;
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

const getNewMessageCount = async (lastMessage, uid, chatId) => {
  if (!lastMessage || lastMessage.senderId == uid) return 0;

  let x = await Chats.findById(chatId)
    .select("messages")
    .populate("messages", "readBy");
  return x.messages.filter((i) => !i.readBy.includes(uid)).length;
};

const getSectionIdByName = async (title) => {
  return (await Sections.findOne({ title }))._id;
};

const isGroupChat = async (chatId) => {
  let chat = await Chats.findOne({ _id: chatId, isGroup: true }).select("_id");
  return chat == null ? false : true;
};

const isAutoReplyEnabled = async (uid, chatId) => {
  let user = await ChatSettings.findOne({
    uid,
    chat: chatId,
    autoReply: true,
  }).select("_id");
  console.log(user);
  return user ? true : false;
};

const getMessageContent = async (messageId) => {
  return (
    await Messages.findById(messageId).select("content").lean()
  ).content.toLowerCase();
};

const getOtherParticipant = async (chatId, currentParticipant) => {
  return (
    await Chats.findById(chatId).select({
      participants: {
        $elemMatch: { $ne: currentParticipant },
      },
    })
  ).participants[0]; // will never be undefined!
};

const getAutoReply = async (chatId, sender, message) => {
  let receiver = await getOtherParticipant(chatId, sender);
  console.log("Other: " + receiver);
  // If receiver doesn't have autoReply enabled return;
  if (!(await isAutoReplyEnabled(receiver, chatId))) return;

  console.log("Auto Reply is enabled.");

  // Get the content of sent message.
  let messageContent = (await getMessageContent(message)).toLowerCase();
  console.log(`New Message Content; ${messageContent}`);

  // Find all auto-replies of this chat of the receiver
  let autoReply = await AutoReply.find({
    chat: chatId,
    user: receiver,
    // message: messageContent,
  }).select("message reply");

  // Find if message contains any "auto-reply" part
  // + This logic is not good at all.
  // for (let i = 0; i < autoReply.length; i++) {
  //   if (messageContent.includes(autoReply[i].message)) {
  //     let newMessage = await chatController.sendMessage(
  //       chatId,
  //       receiver,
  //       autoReply[i].reply
  //     );
  //     return newMessage;
  //   }
  // }
  // Find if message matches an "auto-reply"
  for (let i = 0; i < autoReply.length; i++) {
    if (autoReply[i].message.toLowerCase() == messageContent) {
      let newMessage = await chatController.sendMessage(
        chatId,
        receiver,
        autoReply[i].reply
      );
      return newMessage;
    }
  }

  // No autoreply was found
};

const isJoinRequested = async (uid, gid) => {
  return (await GroupRequests.countDocuments({ user: uid, gid })) > 0;
};

const aggregatePosts = async (uid, group_id) => {
  let posts = await PostInteraction.aggregate([
    {
      $match: { group_id: new Types.ObjectId(group_id) },
    },
    {
      $lookup: {
        from: "postgroups",
        localField: "group_id",
        foreignField: "_id",
        as: "groupData",
        pipeline: [
          {
            $project: {
              admins: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "posts",
        localField: "post",
        foreignField: "_id",
        as: "postData",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "authorData",
            },
          },
          { $unwind: "$authorData" },
          {
            $project: {
              _id: 1,
              content: 1,
              attachments: 1,
              type: 1,
              createdAt: 1,
              is_pinned: 1,
              "authorData._id": 1,
              "authorData.name": 1,
              "authorData.imgUrl": 1,
            },
          },
        ],
      },
    },
    { $unwind: "$postData" },
    { $unwind: "$groupData" },
    {
      $project: {
        _id: 1,
        group_id: 1,
        allowCommenting: 1,
        hasLiked: { $in: [new Types.ObjectId(uid), "$likes"] },
        is_pinned: 1,
        commentCount: { $size: "$comments" },
        likesCount: { $size: "$likes" },
        isAuthor: {
          $eq: ["$postData.authorData._id", new Types.ObjectId(uid)],
        },
        isGroupAdmin: {
          $in: [new Types.ObjectId(uid), "$groupData.admins"],
        },
        postData: 1,
      },
    },
    { $sort: { is_pinned: -1, "postData.createdAt": -1 } },
  ]);
  return posts;
};

const vipMessageHandling = async (senderId, messageId, chatId) => {
  console.log(`SenderID: ${senderId}`);
  let vipCollectionsContainingSender = await VipCollections.find({
    people: { $eq: senderId },
  }).select("creator");

  console.log(vipCollectionsContainingSender);

  if (vipCollectionsContainingSender.length == 0) return;

  return await Promise.all(
    vipCollectionsContainingSender.map(async (e) => {
      let isCreatorInCurrentChat = await Chats.find({
        _id: chatId,
        participants: { $eq: e.creator },
      });

      if (isCreatorInCurrentChat) {
        await VipCollections.findByIdAndUpdate(e._id, {
          $push: { messages: messageId },
        });
      }

      return e._id;
    })
  );
};

const sortTimetable = (arr) =>
  arr.sort((a, b) => {
    const getMinutes = (timeStr) => {
      let [hours, minutes] = timeStr.split(":").map(Number);

      if (hours < 8) {
        hours += 12; // Assume times like 2:00, 3:00, etc. are PM
      }

      return hours * 60 + minutes;
    };

    const aMinutes = getMinutes(a.start_time);
    const bMinutes = getMinutes(b.start_time);

    return aMinutes - bMinutes;
  });

const getFriendsIds = async (uid) => {
  let friends = await Friends.find({
    status: "accepted",
    $or: [{ uid }, { friend_id: uid }],
  }).select("uid friend_id");

  return friends.map((e) => (e.uid == uid ? e.friend_id : e.uid));
};

const getCoursesMapping = async (code) => {
  let courses = await CourseMap.findOne({ courses: code }).select(
    "-_id courses"
  );
  // console.log(courses)
  if (courses != null) return courses.courses;
  return [code];
  // return;
};

const getSections = async () =>
  Sections.find()
    .select("title _id")
    .then((sections) =>
      sections.reduce((acc, section) => {
        acc[section.title] = section._id;
        return acc;
      }, {})
    );

const selectGroupChats = async (ids, fields) => {
  return (await ChatGroups.find({ _id: ids }).select(fields).lean()).map(
    (e) => ({ ...e, type: "chat" })
  );
};

const selectPostGroups = async (ids, fields) => {
  return (await PostGroups.find({ _id: ids }).select(fields).lean()).map(
    (e) => ({ ...e, type: "post" })
  );
};

const getRandomThree = (arr) => arr.sort(() => Math.random() - 0.5).slice(0, 3);

export {
  selectGroupChats,
  selectPostGroups,
  getRandomThree,
  getOtherParticipant,
  getAutoReply,
  getCurrentSession,
  getStudentSections,
  getMessageContent,
  getCurrentSessionId,
  getNewMessageCount,
  getSectionIdByName,
  isGroupChat,
  vipMessageHandling,
  getCourseIdByCode,
  getFriendsIds,
  aggregatePosts,
  getCoursesMapping,
  intersection,
  getSections,
  sortTimetable,
  isAutoReplyEnabled,
  isJoinRequested,
};
