import { Chats, Users, Messages } from "../database/models/models.js";

import { getNewMessageCount } from "../utils/utils.js";


// Realtime Chatting Pseudo Steps
// 1. Initiate a socket connection when user opens chat screen? (SEE ****)
// 2. 

export default {
  // Personal Chats
  initiateChat: async function (sender, receiver) {
    let chat = new Chats({
      participants: [sender, receiver],
      totalParticipants: 2,
    });

    await chat.save();
    await Users.updateMany(
      { _id: { $in: [sender, receiver] } },
      { $push: { activeChats: chat._id } }
    );

    return chat._id;
  },

  getAllChats: async function (uid) {
    // Actually HERE: ****
    // When getAllChats route is shit.
    // Connect to WebSocket Server at the same time.
    // join room when a specific chat is opened
    //
    let userChats = await Users.findById(uid)
      .select("activeChats")
      .populate({
        path: "activeChats",
        select: "participants messages",
        options: { sort: { updatedAt: -1 } },
        populate: [
          {
            path: "participants",
            select: "name avatarURL",
            match: { _id: { $ne: uid } }, // Gets the "other" user
          },
          { path: "messages", select: "content senderId createdAt -_id" },
        ],
      });
    return Promise.all(
      userChats.activeChats.map(async (e) => ({
        id: e._id,
        chatInfo: e.participants[0],
        lastMessage: e.messages.slice(-1)[0] ?? {},
        newMessageCount: await getNewMessageCount(
          e.messages.slice(-1)[0],
          uid,
          e._id
        ),
      }))
    );
  },
  // NOTE: Read Logic will be handled on frontned.
  getChat: async function (chatId, uid, newMessageCount) {
    // Read all previous messages.
    if (newMessageCount > 0)
      await this.readMessages(chatId, uid, newMessageCount);

    let chat = await Chats.findById(chatId)
      .select("messages totalParticipants")
      .populate({
        path: "messages",
        select: "content attachments readCount createdAt",
        populate: [
          {
            path: "reply",
            select: "content attachments senderId",
          },
          {
            path: "senderId",
            select: "name avatarURL",
          },
        ],
      });

    return chat;
  },

  sendMessage: async function (
    chatId,
    senderId,
    content,
    attachments = [],
    isReply = false,
    replyId = undefined
  ) {
    let message = new Messages({
      content,
      attachments,
      senderId,
      readBy: [senderId], //woops
      isReply,
      reply: replyId,
    });
    
    await message.save();

    await Chats.findByIdAndUpdate(chatId, {
      $push: { messages: message._id },
    });
  },

  readMessages: async function (chatId, uid, messageCount) {
    // Slice from last.
    let messages = (await Chats.findById(chatId)).messages.slice(
      -1 * messageCount
    );
    await Messages.updateMany(
      { _id: { $in: messages } },
      { $addToSet: { readBy: uid }, $inc: { readCount: 1 } }
    );
  },

  deleteMessage: async function (messageId) {
    await Messages.findByIdAndDelete(messageId);
  },
};
