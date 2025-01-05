import {
  Sessions,
  Chats,
  Enrollment,
  Sections,
  UserSettings,
  AutoReply,
  Messages,
  VipCollections,
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
  let user = await UserSettings.findOne({ uid, autoReply: true }).select("_id");
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

  // If receiver doesn't have autoReply enabled return undefined;
  if (!(await isAutoReplyEnabled(receiver))) return undefined;

  console.log("Auto Reply is enabled.");

  // Get the content of sent message.
  let messageContent = await getMessageContent(message);
  console.log(`New Message Contnet; ${messageContent}`);

  // Find autoReply of receiver of this chat <chatId>
  let autoReply = await AutoReply.findOne({
    chat: chatId,
    user: receiver,
    // message: messageContent,
  }).select("message reply");

  // if autoReply is not undefined and message is same as the "sent" messageContent create the autoreply message
  if (autoReply && autoReply.message.toLowerCase() == messageContent) {
    let newMessage = await chatController.sendMessage(
      chatId,
      receiver,
      autoReply.reply
    );
    return newMessage;
  }
  // No autoreply was found
  return undefined;
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
};
