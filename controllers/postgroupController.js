import {
  PostGroups,
  GroupMembers,
  Posts,
  ChatGroups,
  GroupRequests,
  Notifications,
  Chats,
  Users,
} from "../database/models/models.js";
import chatGroupController from "./chatGroupController.js";

export default {
  getGroup: async function (gId, requesterId) {
    let group = await PostGroups.findById(gId);
    if (!group) return {};

    /*

        Offical groups handling

    */

    let isAdmin = group.admins.includes(requesterId);

    if (group.isOfficial) {
      if (!isAdmin) return { accessible: false };
    } else {
      let isMember = await GroupMembers.findOne({ gid: gId, uid: requesterId });

      if (!isMember && group.is_private) {
        return {
          name: group.name,
          imgUrl: group.imgUrl,
          totalMembers: group.totalMembers,
          is_private: group.is_private,
          isMember: false,
          accessible: true,
        };
      }
    }

    let isCreator = group.admins[0] == requesterId;

    // TODO: ADD PAGINATION FOR INIFINITE SCROLLING
    let posts = await Posts.find({ group_id: gId })
      .populate("author", "name avatarURL")
      .select("-group_id -privacyLevel -updatedAt")
      .sort({ is_pinned: -1, createdAt: -1 });

    return { accessible: true, groupInfo: group, isCreator, isAdmin, posts };
  },

  newHybribGroup: async function (
    creator_id,
    name,
    imgUrl,
    aboutGroup,
    allowPosting,
    allowChatting,
    is_private
  ) {
    let postGroup = await this.newGroup(
      creator_id,
      name,
      imgUrl,
      aboutGroup,
      allowPosting,
      is_private
    );
    await this.addChatGroup(postGroup, allowChatting);
    return postGroup;
  },

  newGroup: async function (
    creator_id,
    name,
    imgUrl,
    allowPosting,
    aboutGroup,
    is_private,
    isOfficial = false,
    isSociety = false
  ) {
    let group = new PostGroups({
      name,
      imgUrl,
      is_private,
      admins: [creator_id],
      aboutGroup, 
      allowPosting,
      isOfficial,
      isSociety, 
    });

    await group.save();
    await this.addToGroup(group._id, creator_id);
    return group._id;
  },

  addChatGroup: async function (gid, allowChatting = true) {
    let group = await PostGroups.findById(gid);

    let groupMembers = await this.getGroupMembers(gid);
    let chat = new Chats({
      type: 1,
      participants: groupMembers,
    });

    await chat.save();
    let chatGroup = new ChatGroups({
      name: group.name,
      imgUrl: group.imgUrl,
      admins: group.admins,
      chat: chat._id,
      allowChatting,
    });
    await chatGroup.save();

    await Users.updateMany(
      { _id: { $in: groupMembers } },
      { $push: { groupChats: chatGroup._id } }
    );

    group.hasGroupChat = chatGroup._id;
    await group.save();
  },

  addToGroup: async function (gid, uid) {
    await GroupMembers.insertMany([
      {
        gid,
        uid,
      },
    ]);
  },

  bulkAddMembers: async function (gid, users) {
    let membersArray = users.map((uid) => ({
      gid,
      uid,
    }));
    await GroupMembers.insertMany(membersArray);
  },

  addAdmins: async function (gid, admins) {
    let group = await PostGroups.findById(gid);
    group.admins.addToSet(...admins);
    // group.admins.addToSet()
    await group.save();
  },

  updateGroupSettings: async function (gid, settings) {
    await PostGroups.findByIdAndUpdate(gid, settings);
  },

  joinGroup: async function (gid, uid) {
    let group = await PostGroups.findById(gid).select("is_private name admins");
    if (group.is_private) {
      let request = new GroupRequests({
        user: uid,
        gid,
      });
      await request.save();


      // Notify group admins about the request.
      let groupsAdmins = group.admins;
      let notifications = [];

      groupsAdmins.forEach((e) => {
        notifications.push({
          user: e,
          content: `New Join Request in Group: ${group.name}`,
          image1: group.imgUrl,
        });
      });

      await Notifications.insertMany(notifications);

      //////////////////////////////////////////////////
      return { message: "Requested.." };
    } else {
      await this.addToGroup(gid, uid);
      return { message: "Group Joined!" };
    }
  },

  getPendingRequests: async function (gid) {
    return await GroupRequests.find({ gid })
      .select("-gid")
      .populate("user", "name avatarURL");
  },

  approveRequest: async function (reqId) {
    let request = await GroupRequests.findByIdAndDelete(reqId).select(
      "user gid"
    );
    let group = await PostGroups.findById(request.gid).select("name imgUrl");
    await this.addToGroup(request.gid, request.user);
    let notification = new Notifications({
      type: "welcome",
      user: request.user,
      content: `Your Request to join ${group.name} has been approved.`,
      image1: group.imgUrl,
    });
    await notification.save();
  },

  rejectRequest: async function (reqId) {
    await GroupRequests.findByIdAndDelete(reqId);
  },

  deleteGroup: async function (gId) {
    await PostGroups.findByIdAndDelete(gId); // Delete Group
    await GroupMembers.deleteMany({ gid: gId }); // Remove all group members
    await Posts.deleteMany({ group_id: gId }); // Delete Posts
    await GroupRequests.deleteMany({ gid: gId }); // Delete Group Requests
  },

  getGroupMembers: async function (gid) {
    return (await GroupMembers.find({ gid }).select("uid")).map((e) => e.uid);
  },

  // leave / remove
  removeMembers: async function (gid, uid) {
    await GroupMembers.deleteOne({ gid, uid });
    let group = await PostGroups.findById(gid).select("hasGroupChat");
    if (group.hasGroupChat)
      await chatGroupController.removeMember(group.hasGroupChat, uid);
  },
};
