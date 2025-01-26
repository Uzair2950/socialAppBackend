import {
  Sessions,
  Chats,
  Enrollment,
  Sections,
  AutoReply,
  Messages,
  VipCollections,
  ChatSettings,
  Users,
  Courses,
  Friends,
} from "../database/models/models.js";

import chatController from "../controllers/chatController.js";

const getCurrentSession = async () => {
  return await Sessions.findOne({ has_commenced: false }).lean();
};

const getCurrentSessionId = async () => {
  return (await getCurrentSession())._id;
};

const getStudentSections = async (sid) => {
  return await Enrollment.find({
    student: sid,
    session: (await getCurrentSession())._id,
  }).distinct("section");
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

const isAutoReplyEnabled = async (uid) => {
  let user = await Users.findOne({ _id: uid, autoReply: true }).select("_id");
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

const getFriendsIds = async (uid) => {
  let friends = await Friends.find({
    status: "accepted",
    $or: [{ uid }, { friend_id: uid }],
  }).select("uid friend_id");

  return friends.map((e) => (e.uid == uid ? e.friend_id : e.uid));
};

export {
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
};
