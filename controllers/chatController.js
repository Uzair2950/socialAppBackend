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

  // getAllChats: async function (uid) {
  //   let userChats = await Users.findById(uid)
  //     .select("activeChats groupChats")
  //     .populate([
  //       {
  //         path: "activeChats",
  //         select: "participants messages totalParticipants",
  //         options: { sort: { updatedAt: -1 } },
  //         populate: [
  //           {
  //             path: "participants",
  //             select: "name avatarURL",
  //             match: { _id: { $ne: uid } }, // Gets the "other" user
  //           },
  //           {
  //             path: "messages",
  //             select: "content senderId createdAt -_id",
  //             options: { $slice: -1 },
  //           },
  //         ],
  //       },
  //       {
  //         path: "groupChats",
  //         select: "name avatarURL chat",
  //         populate: {
  //           path: "chat",
  //           select: "type",
  //           populate: {
  //             path: "messages",
  //             select: "content senderId createdAt -_id",
  //             options: { $slice: -1 },
  //           },
  //         },
  //       },
  //     ]);
  //   return Promise.all(
  //     userChats.activeChats.map(async (e) => ({
  //       id: e._id,
  //       chatInfo: e.participants[0],
  //       totalParticipants: e.totalParticipants,
  //       lastMessage: e.messages.slice(-1)[0] ?? {
  //         senderId: "",
  //         content: "",
  //         createdAt: "",
  //       },
  //       newMessageCount: await getNewMessageCount(
  //         e.messages.slice(-1)[0],
  //         uid,
  //         e._id
  //       ),
  //     }))
  //   );
  // },

  getAllChats: async function (uid) {
    let userChats = await Users.findById(uid)
      .select("activeChats groupChats -_id")
      .populate({
        path: "groupChats",
        select: "chat name avatarURL",
      });
    let groupChats = userChats.groupChats.map((e) => e.chat);
    let chats = await Chats.find(
      { _id: [...groupChats, ...userChats.activeChats] },
      {
        isGroup: 1,
        totalParticipants: 1,
        participants: {
          $elemMatch: { $ne: uid },
        },
        messages: { $slice: -1 },
      },
      { sort: { updatedAt: -1 } }
    ).populate([
      {
        path: "messages",
        select: "content senderId createdAt -_id",
      },
      {
        path: "participants",
        select: "name avatarURL",
      },
    ]);

    let transformedChats = await Promise.all(
      chats.map(async (e) => {
        let chatInfo = {
          _id: e.participants[0]._id,
          name: e.participants[0].name,
          avatarURL: e.participants[0].avatarURL,
        };
        if (e.isGroup) {
          let chatGroupDetails = userChats.groupChats.filter(
            (i) => i.chat.toString() == e._id.toString()
          )[0];
          chatInfo = {
            _id: chatGroupDetails._id,
            name: chatGroupDetails.name,
            avatarURL: chatGroupDetails.avatarURL,
          };
        }

        return {
          id: e._id,
          chatInfo,
          totalParticipants: e.totalParticipants,
          isGroup: e.isGroup,
          lastMessage: e.messages[0] ?? {
            senderId: "",
            content: "",
            createdAt: "",
          },
          newMessageCount: await getNewMessageCount(e.messages[0], uid, e._id),
        };
      })
    );

    return transformedChats;
  },

  // NOTE: Read Logic will be handled on frontned.
  getChat: async function (chatId, uid = "", newMessageCount = 0) {
    if (newMessageCount == NaN) newMessageCount = 0;
    // Read all previous messages.
    if (newMessageCount > 0 && uid != "")
      await this.readMessages(chatId, uid, newMessageCount);

    let chat = await Chats.findById(chatId)
      .select("messages totalParticipants isGroup")
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

  getMessage: async function (mid, uid) {
    let message = await Messages.findById(mid)
      .select("content attachments readCount readBy createdAt reply senderId")
      .populate([
        {
          path: "reply",
          select: "content attachments senderId",
        },
        {
          path: "senderId",
          select: "name avatarURL",
        },
      ]);

    if (uid != 0 && !message.readBy.includes(uid))
      await this.readMessageById(mid, uid);

    return message;
  },

  sendMessage: async function (
    chatId,
    senderId,
    content,
    attachments = [],
    isReply = false,
    replyId = undefined
  ) {
    try {
      let message = new Messages({
        content,
        attachments,
        senderId,
        readBy: [senderId], //woops
        isReply,
        reply: replyId,
      });

      // message.readBy.addToSet(senderId)

      await message.save();

      await Chats.findByIdAndUpdate(chatId, {
        $push: { messages: message._id },
      });

      return message._id;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  },

  readMessageById: async function (mid, uid) {
    await Messages.findByIdAndUpdate(mid, {
      $addToSet: { readBy: uid },
      $inc: { readCount: 1 },
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
