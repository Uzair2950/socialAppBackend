import {
  Chats,
  ChatGroups,
  Users,
  GroupMembers,
} from "../database/models/models.js";

import chatController from "./chatController.js";

export default {
  getGroupChat: async function (gid, uid) {
    let group = await ChatGroups.findById(gid).select(
      "name imgUrl aboutGroup allowChatting admins chat"
    );

    let isAdmin = group.admins.includes(uid);

    let chat = await chatController.getChat(group.chat);

    return {
      groupInfo: {
        name: group.name,
        imgUrl: group.imgUrl,
        aboutGroup: group.aboutGroup,
        canChat: group.allowChatting || isAdmin,
        isAdmin,
      },
      chat,
    };
  },

  getParticipants: async function (gid) {
    let group = await ChatGroups.findById(gid).select("chat admins");

    let chatParticipants = await Chats.findById(group.chat)
      .select("participants")
      .populate("participants", "name imgUrl");

    return chatParticipants.participants.map((e) => ({
      id: e._id,
      name: e.name,
      imgUrl: e.imgUrl,
      isAdmin: group.admins.includes(e._id),
    }));
  },

  newGroupChat: async function (
    creator_id,
    name,
    imgUrl,
    aboutGroup,
    allowChatting,
    isAnnoucement = false
  ) {
    console.log(imgUrl);
    let chat = new Chats({
      type: 1,
      participants: [creator_id],
      isGroup: true,
    });
    let group = new ChatGroups({
      name,
      imgUrl: imgUrl,
      aboutGroup,
      allowChatting,
      admins: [creator_id],
      chat: chat._id,
    });
    if (!isAnnoucement)
      await Users.findByIdAndUpdate(creator_id, {
        $push: { groupChats: group._id },
      });

    await chat.save();
    await group.save();

    return group._id;
  },

  // Add user.
  addToGroupChat: async function (gid, uid) {
    let chatGroup = await ChatGroups.findById(gid).select("chat -_id");

    if (!chatGroup) return;

    await Users.findByIdAndUpdate(uid, {
      // Add in user's active group chats.
      $push: { groupChats: gid },
    });
    await Chats.findByIdAndUpdate(chatGroup.chat, {
      // Add participant
      $push: { participants: uid },
      $inc: { totalParticipants: 1 },
    });
  },

  // Admins

  getAdmins: async function (gid) {
    let group = await ChatGroups.findById(gid)
      .select("admins")
      .populate("admins", "name imgUrl");

    return group.admins;
  },

  addAdmins: async function (gid, admins) {
    let group = await ChatGroups.findById(gid);
    group.admins.addToSet(...admins);
    await group.save();
  },

  removeAdmin: async function (gid, admin) {
    await ChatGroups.findByIdAndUpdate(gid, { $pull: { admins: admin } });
  },

  updateGroupSettings: async function (gid, settings) {
    await ChatGroups.findByIdAndUpdate(gid, settings);
  },

  removeMember: async function (gid, uid) {
    let chatid = await ChatGroups.findById(gid).select("chat");

    await Chats.findByIdAndUpdate(chatid.chat, {
      $pull: { participants: uid },
      $inc: { totalParticipants: -1 },
    });

    await Users.findByIdAndUpdate(uid, {
      $pull: { groupChats: chatid._id },
    }); // Remove from users
  },
};
