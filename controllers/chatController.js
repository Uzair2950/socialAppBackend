import { Filter } from "bad-words";
import {
  Chats,
  Users,
  Messages,
  ChatSettings,
  AutoReply,
  ScheduledMessages,
  ChatGroups,
} from "../database/models/models.js";

import { getNewMessageCount } from "../utils/utils.js";

let filter = new Filter(); // Language Filter

export default {
  // Personal Chats

  initiateChat: async function (sender, receiver) {
    let receiverDetails = await Users.findById(receiver).select(
      "name avatarURL"
    );
    if (!receiverDetails) return;
    let chat = new Chats({
      participants: [sender, receiver],
      totalParticipants: 2,
    });

    await chat.save();

    // Add chats to activeChats of both users
    await Users.updateMany(
      { _id: { $in: [sender, receiver] } },
      { $push: { activeChats: chat._id } }
    );

    // Create setting & save settings
    await ChatSettings.insertMany([
      {
        uid: sender,
        chat: chat._id,
      },
      {
        uid: receiver,
        chat: chat._id,
      },
    ]);
    return chat._id;
    // return {
    //   id: chat._id,
    //   chatInfo: {
    //     _id: receiver,
    //     name: receiverDetails.name,
    //     avatarURL: receiverDetails.avatarURL,
    //   },
    //   totalParticipants: 2,
    //   isGroup: false,
    //   lastMessage: {
    //     senderId: "",
    //     content: "",
    //     createdAt: "",
    //     attachments: [],
    //   },
    //   newMessageCount: 0,
    // }
  },

  getChatSettings: async function (chat, uid) {
    return await ChatSettings.findOne({ chat, uid });
  },

  getAutoReplies: async function (user, chat) {
    return await AutoReply.find({ user, chat }).select("_id message reply");
  },

  addAutoReply: async function (uid, chat, autoreplies) {
    let replies = await AutoReply.insertMany(
      autoreplies.map((e) => ({ user: uid, chat, ...e }))
    );
    return replies;
  },

  removeAutoReply: async function (autoReplyId) {
    await AutoReply.findByIdAndDelete(autoReplyId);
  },

  editAutoReply: async function (replyId, message, reply) {
    await AutoReply.findByIdAndUpdate(replyId, { message, reply });
  },

  // getAutoReplies: async function (uid) {
  //   // Damn
  //   // 1. Fetches the user's auto-replies
  //   // 2. Gets & Populates the "other" participant (*)
  //   // 3. Transforms the object
  //   // 4. Groups all replies by their chatId // (+)
  //   // Returns somthing like this:
  //   /*[chatId:string]: {
  //     details: {name: string, avatarURL: string},
  //     messages: [{id: string/objectId, message: string, reply: string}]
  //   }*/

  //   let groupedByChats = (
  //     await AutoReply.find({ user: uid })
  //       .select("-user")
  //       .populate([
  //         {
  //           path: "chat",
  //           select: {
  //             _id: 1,
  //             participants: {
  //               $elemMatch: { $ne: uid }, // * $ne => not equals
  //             },
  //           },
  //           populate: {
  //             // *
  //             path: "participants",
  //             select: "name avatarURL -_id",
  //           },
  //         },
  //       ])
  //       .lean()
  //   )
  //     .map((e) => ({
  //       ...e,
  //       chat: { id: e.chat._id, details: e.chat.participants[0] },
  //     }))
  //     .reduce((chats, curr) => {
  //       // +
  //       chats[curr.chat.id] = chats[curr.chat.id] || {};
  //       chats[curr.chat.id].details = curr.chat.details || {};
  //       chats[curr.chat.id].replies = chats[curr.chat.id].replies || [];
  //       chats[curr.chat.id].replies.push({
  //         id: curr._id,
  //         message: curr.message,
  //         reply: curr.reply,
  //       });
  //       return chats;
  //     }, {});
  //   return groupedByChats;
  // },

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

  // Auto - Download

  toggleAutoDownload: async function (sid) {
    let settings = await ChatSettings.findById(sid);
    settings.autoDownload = !settings.autoDownload;
    await settings.save();
    return settings.autoDownload;
  },

  updateDownloadDirectory: async function (settingsId, dir) {
    await ChatSettings.findByIdAndUpdate(settingsId, {
      autoDownloadDirectory: dir,
    });
  },

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

        select: {
          content: 1,
          senderId: 1,
          createdAt: 1,
          _id: 0,
          attachments: 1,
        },
      },
      {
        path: "participants",
        select: "name avatarURL",
      },
    ]);

    let transformedChats = await Promise.all(
      chats.map(async (e) => {
        let chatInfo = {
          _id: e.participants[0]?._id ?? "",
          name: e.participants[0]?.name ?? "",
          avatarURL: e.participants[0]?.avatarURL ?? "",
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
            attachments: [],
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
        content: filter.clean(content),
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
      { _id: { $in: messages } }, // { _id:  messages }  should work too?
      { $addToSet: { readBy: uid }, $inc: { readCount: 1 } }
    );
  },

  deleteMessage: async function (messageId, cid) {
    await Messages.findByIdAndDelete(messageId); // Delete the message
    await Chats.findByIdAndUpdate(cid, { $pull: { messages: messageId } });
  },

  // Scheduler;
  scheduleMessages: async function (
    personalChats = [],
    groupChats = [],
    messageContent,
    messageAttchments,
    senderId,
    pushTime
  ) {
    let groupChatsIds = await ChatGroups.find({ _id: groupChats }).select(
      "chat"
    );
    // Find Chats of groupChats
    let chats = [...groupChatsIds.map((e) => e.chat), ...personalChats];
    let message = new Messages({
      content: filter.clean(messageContent),
      attachments: messageAttchments,
      senderId,
    });

    await message.save();

    let sMessage = new ScheduledMessages({
      chat: chats,
      sender: senderId,
      message: message._id,
      pushTime,
    });
    await sMessage.save();
    return sMessage._id;
  },

  deleteScheduledMessage: async function (mid) {
    await ScheduledMessages.findByIdAndDelete(mid);
  },
};
