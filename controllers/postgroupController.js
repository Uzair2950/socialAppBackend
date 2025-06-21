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
import { aggregatePosts, isJoinRequested } from "../utils/utils.js";
import chatGroupController from "./chatGroupController.js";

export default {
  getGroup: async function (gId, requesterId) {
    let group = await PostGroups.findById(gId).select(
      "-updatedAt -isSociety -createdAt -isOfficial -updatedAt -__v"
    );

    let isMember = await GroupMembers.findOne({ gid: gId, uid: requesterId });

    if (!isMember && group.is_private) {
      return {
        groupInfo: {
          _id: group._id,
          name: group.name,
          imgUrl: group.imgUrl,
          totalMembers: group.totalMembers,
          is_private: group.is_private,
          aboutGroup: group.aboutGroup,
        },
        isRequested: await isJoinRequested(requesterId, gId),
        isMember: false,
      };
    }

    let isAdmin = group.admins.includes(requesterId);

    let isCreator = group.admins[0] == requesterId;

    // let posts = await Posts.find({ group_id: gId })
    //   .populate("author", "name imgUrl")
    //   .select("-group_id -privacyLevel -updatedAt")
    //   .sort({ /* is_pinned: -1, */ createdAt: -1 }); // TODO: Fix Pin Logic

    let posts = await aggregatePosts(requesterId, gId);

    return { groupInfo: group, isCreator, isAdmin, isMember: true, posts };
  },

  // controllers/postgroupController.js
  getAllGroups: async function () {
    let groups = await PostGroups.find({})
      .select("_id name imgUrl is_private totalMembers aboutGroup")
      .sort({ createdAt: -1 });
    return groups;
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

  // newGroup: async function (
  //   creator_id,
  //   name,
  //   imgUrl,
  //   allowPosting,
  //   aboutGroup,
  //   is_private,
  //   isOfficial = false,
  //   isSociety = false
  // ) {
  //   let group = new PostGroups({
  //     name,
  //     imgUrl,
  //     is_private,
  //     admins: [creator_id],
  //     aboutGroup,
  //     allowPosting,
  //     isOfficial,
  //     isSociety,
  //   });

  //   await group.save();
  //   await this.addToGroup(group._id, creator_id);
  //   return group._id;
  // },
  // In your controller (postgroupController.js)

  newGroup: async function (
    creator_id,
    name,
    imgUrl,
    aboutGroup,
    allowPosting,
    is_private,
    isOfficial = false,
    isSociety = false
  ) {
    // Ensure boolean values
    allowPosting = allowPosting === "true" || allowPosting === true;
    is_private = is_private === "true" || is_private === true;
    isOfficial = isOfficial === "true" || isOfficial === true;
    isSociety = isSociety === "true" || isSociety === true;

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
      isGroup: true,
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
  // bulkAddMembers: async function (gid, users) {
  //   // Convert all user IDs to strings for consistent comparison
  //   const userIds = users.map(id => id.toString());

  //   // Check for existing memberships
  //   const existing = await GroupMembers.find({
  //     gid,
  //     uid: { $in: userIds }
  //   }).lean();

  //   const existingIds = existing.map(m => m.uid.toString());
  //   const newMembers = userIds
  //     .filter(uid => !existingIds.includes(uid))
  //     .map(uid => ({ gid, uid }));

  //   if (newMembers.length === 0) {
  //     throw new Error("All selected users are already group members");
  //   }

  //   return await GroupMembers.insertMany(newMembers);
  // },

  addAdmins: async function (gid, admins) {
    let group = await PostGroups.findById(gid);
    group.admins.addToSet(...admins);
    // group.admins.addToSet()
    await group.save();
  },

  // updateGroupSettings: async function (gid, settings) {
  //   await PostGroups.findByIdAndUpdate(gid, settings);
  // },

  // In your postgroupController.js
  // updateGroupSettings: async function (gid, settings, file) {
  //   const updateData = {
  //     name: settings.name,
  //     aboutGroup: settings.aboutGroup,
  //     allowPosting: settings.allowPosting === "true",
  //     is_private: settings.is_private === "true",
  //     isOfficial: settings.isOfficial === "true",
  //     isSociety: settings.isSociety === "true",
  //   };

  //   if (file) {
  //     updateData.imgUrl = `/${file.path.replaceAll("\\", "/")}`;
  //   }

  //   await PostGroups.findByIdAndUpdate(gid, updateData, { new: true });
  // },
  updateGroupSettings: async function (gid, settings, file) {
    try {
      if (!mongoose.Types.ObjectId.isValid(gid)) {
        throw new Error("Invalid group ID");
      }

      const updateData = {
        name: settings.name,
        aboutGroup: settings.aboutGroup,
        allowPosting:
          settings.allowPosting === true || settings.allowPosting === "true",
        is_private:
          settings.is_private === true || settings.is_private === "true",
        isOfficial:
          settings.isOfficial === true || settings.isOfficial === "true",
        isSociety: settings.isSociety === true || settings.isSociety === "true",
        updatedAt: new Date(),
      };
      if (file) {
        updateData.imgUrl = `/${file.path.split(path.sep).join("/")}`;
      }

      // Update the group
      const updatedGroup = await PostGroups.findByIdAndUpdate(gid, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedGroup) {
        throw new Error("Group not found");
      }

      return updatedGroup;
    } catch (error) {
      console.error("Error in updateGroupSettings:", error);
      throw error; // Re-throw to be handled by the route
    }
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
          actor: uid,
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
      .populate("user", "name imgUrl");
  },

  approveRequest: async function (reqId) {
    let request = await GroupRequests.findByIdAndDelete(reqId).select(
      "user gid"
    );
    let group = await PostGroups.findById(request.gid).select("name imgUrl");
    await this.addToGroup(request.gid, request.user);
    let notification = new Notifications({
      type: "welcome_group",
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

  //My added

  getGroupAdmins: async function (gid) {
    try {
      const group = await PostGroups.findById(gid).select("admins name");
      if (!group) {
        throw new Error("Group not found");
      }

      return {
        groupName: group.name,
        admins: group.admins,
      };
    } catch (err) {
      console.error("Get Group Admins Error:", err);
      throw err;
    }
  },

  // leave / remove
  removeMembers: async function (gid, uid) {
    await GroupMembers.deleteOne({ gid, uid });
    let group = await PostGroups.findById(gid).select("hasGroupChat");
    if (group.hasGroupChat)
      await chatGroupController.removeMember(group.hasGroupChat, uid);
  },
};
