import {
  Sessions,
  Chats,
  Enrollment,
  Sections,
  UserSettings,
  AutoReply,
  Messages,
} from "../database/models/models.js";

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

  return chat ? true : false;
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

  console.log("Other Participant: " + receiver);

  // If receiver doesn't have autoReply enabled return undefined;
  if (!isAutoReplyEnabled(receiver)) {
    console.log(`Auto Reply Is not enabled!}`);
    return undefined;
  }

  console.log("Auto Reply is enabled.");

  // Get the content of sent message.
  let messageContent = await getMessageContent(message);
  console.log(`New Message Contnet; ${messageContent}`);
  // THOUGHTS: Read the sent message?

  // Find autoReply of receiver of this chat <chatId>
  let autoReply = await AutoReply.findOne({
    chat: chatId,
    user: receiver,
    // message: messageContent,
  }).select("message reply");

  // if autoReply is not undefined and message is same as the "sent" messageContent create the autoreply message
  if (autoReply && autoReply.message.toLowerCase() == messageContent) {
    console.log("Matched Createing new message");
    let newMessage = new Messages({
      content: autoReply.message,
      senderId: sender,
      readBy: [sender, receiver],
    });

    await newMessage.save();
    return newMessage._id;
  }
  // No autoreply was found
  return undefined;
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
};
