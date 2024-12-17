import {
  Chats,
  ChatGroups,
  Users,
  GroupMembers,
} from "../database/models/models.js";

export default {
  newGroupChat: async function (
    creator_id,
    title,
    imgUrl,
    aboutGroup,
    allowChatting,
    isAnnoucement = false
  ) {
    let chat = new Chats({
      type: 1,
      participants: [creator_id],
    });
    let group = new ChatGroups({
      title,
      imgUrl,
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

  addAdmins: async function (gid, admins) {
    let group = await ChatGroups.findById(gid);
    group.admins.addToSet(...admins);
    await group.save();
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

    let x = await Users.findByIdAndUpdate(uid, {
      $pull: { groupChats: chatid._id },
    }); // Remove from users
    console.log(x);
  },
};
