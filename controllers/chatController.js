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

import { getNewMessageCount, isAutoReplyEnabled } from "../utils/utils.js";

let filter = new Filter(); // Language Filter

export default {
  // Personal Chats

  initiateChat: async function (sender, receiver) {
    let receiverDetails = await Users.findById(receiver).select("name imgUrl");
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
    //     imgUrl: receiverDetails.imgUrl,
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
    let isEnabled = true; //await isAutoReplyEnabled(user, chat);

    let chats = await AutoReply.find({ user, chat }).select(
      "_id message reply"
    );
    return { isEnabled, autoReplies: chats };
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
  //     details: {name: string, imgUrl: string},
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
  //             select: "name imgUrl -_id",
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
  //             select: "name imgUrl",
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
  //         select: "name imgUrl chat",
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
        select: "chat name imgUrl",
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
        select: "name imgUrl",
      },
    ]);

    let transformedChats = await Promise.all(
      chats.map(async (e) => {
        let chatInfo = {
          _id: e.participants[0]?._id ?? "",
          name: e.participants[0]?.name ?? "",
          imgUrl: e.participants[0]?.imgUrl ?? "",
        };
        if (e.isGroup) {
          let chatGroupDetails = userChats.groupChats.filter(
            (i) => i.chat.toString() == e._id.toString()
          )[0];
          chatInfo = {
            _id: chatGroupDetails._id,
            name: chatGroupDetails.name,
            imgUrl: chatGroupDetails.imgUrl,
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

  getAllChats_short: async function (uid) {
    let userChats = await Users.findById(uid)
      .select("activeChats groupChats -_id")
      .populate({
        path: "groupChats",
        select: "chat name imgUrl",
      });
    let groupChats = userChats.groupChats.map((e) => e.chat);

    let chats = await Chats.find(
      { _id: [...groupChats, ...userChats.activeChats] },
      {
        isGroup: 1,
        participants: {
          $elemMatch: { $ne: uid },
        },
      }
    ).populate([
      {
        path: "participants",
        select: "name imgUrl",
      },
    ]);

    let transformedChats = await Promise.all(
      chats.map(async (e) => {
        let obj = {
          _id: e._id,
          name: e.participants[0]?.name ?? "",
          imgUrl: e.participants[0]?.imgUrl ?? "",
          isGroup: false,
        };
        if (e.isGroup) {
          let chatGroupDetails = userChats.groupChats.filter(
            (i) => i.chat.toString() == e._id.toString()
          )[0];

          obj.name = chatGroupDetails.name;
          obj.imgUrl = chatGroupDetails.imgUrl;
          obj.isGroup = true;
        }

        return obj;
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
            select: "name imgUrl",
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
          select: "name imgUrl",
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
  // scheduleMessages: async function (
  //   chats,
  //   messageContent,
  //   messageAttchments = [],
  //   senderId,
  //   pushTime
  // ) {
  //   let message = new Messages({
  //     content: filter.clean(messageContent),
  //     attachments: messageAttchments,
  //     senderId,
  //   });

  //   await message.save();

  //   let sMessage = new ScheduledMessages({
  //     chat: chats,
  //     sender: senderId,
  //     message: message._id,
  //     pushTime,
  //   });
  //   await sMessage.save();
  //   return sMessage._id;
  // },
  scheduleMessages: async function (
    chats, // Now expects combined array
    messageContent,
    messageAttchments = [],
    senderId,
    pushTime
  ) {
    let message = new Messages({
      content: filter.clean(messageContent),
      attachments: messageAttchments,
      senderId,
    });

    await message.save();

    let sMessage = new ScheduledMessages({
      chat: chats, // Directly use the combined array
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

  /////

  modifyAutoReplies: async function (obj) {
    let { uid, chatId, autoReply, edits, newreplies } = obj;
    console.log(uid, chatId, autoReply, edits, newreplies);
    await ChatSettings.updateOne({ uid, chat: chatId }, { autoReply }); // Toggle

    if (edits.length > 0)
      await Promise.all(
        edits.map(async (e) => {
          console.log(
            await AutoReply.findByIdAndUpdate(e.id, {
              message: e.message,
              reply: e.reply,
            })
          );
        })
      );
    if (newreplies.length > 0)
      console.log(await AutoReply.insertMany(newreplies));
  },

  getChatParticipant: async function (chatId, uid) {
    try {
      const chat = await Chats.findById(chatId).select("participants");

      if (!chat) {
        throw new Error("Chat not found");
      }

      // Find the participant who is not the current user
      const otherParticipant = chat.participants.find(
        (participant) => participant.toString() !== uid
      );

      if (!otherParticipant) {
        throw new Error("No other participant found");
      }

      return { participantId: otherParticipant };
    } catch (error) {
      console.error("Error getting chat participant:", error);
      throw error;
    }
  },
};
