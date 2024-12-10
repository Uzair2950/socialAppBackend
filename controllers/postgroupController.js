import {
  PostGroups,
  GroupMembers,
  Posts,
  ChatGroups,
  GroupRequests,
  Notifications,
} from "../database/models/models.js";

export default {
  getGroup: async function (gId, requesterId) {
    let group = await PostGroups.findById(gId);
    if (!group) return {}
    let isMember = await GroupMembers.findOne({ gid: gId, uid: requesterId });

    if (!isMember && group.is_private) {
      return {
        title: group.title,
        imgUrl: group.imgUrl,
        totalMembers: group.totalMembers,
        is_private: group.is_private,
        isMember: false,
      };
    }

    let isAdmin = group.admins.includes(requesterId);
    let isCreator = group.admins[0] == requesterId;

    // Sort by pinned to bring pinned on top
    // Not sure what impact it will have on performance.
    // TODO: ADD PAGINATION FOR INIFINITE SCROLLING
    let posts = await Posts.find({ group_id: gId }).populate('author', 'name avatarURL').select('-group_id -privacyLevel -updatedAt').sort({ is_pinned: -1 });
    let hasChatGroup = (await ChatGroups.findOne({ hasPostGroup: gId }))
      ? true
      : false;

    return { groupInfo: group, isCreator, isAdmin, hasChatGroup, posts };
  },
  newGroup: async function (
    creator_id,
    title,
    imgUrl,
    aboutGroup,
    allowPosting,
    is_private
  ) {
    let group = new PostGroups({
      title,
      imgUrl,
      is_private,
      admins: [creator_id],
      aboutGroup,
      allowPosting,
    });

    await group.save();
    await this.addToGroup(group._id, creator_id);
  },

  addToGroup: async function (gid, uid) {
    await GroupMembers.insertMany([
      {
        gid,
        uid,
      },
    ]);
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
    console.log("Joining Group", gid, uid);
    let group = await PostGroups.findById(gid).select("is_private");
    if (group.is_private) {
      let request = new GroupRequests({
        user: uid,
        gid,
      });
      await request.save();
      return { message: "Requested.." };
      // TODO: Add notification for group admins/Owner.
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
    let group = await PostGroups.findById(request.gid).select("title imgUrl");
    await this.addToGroup(request.gid, request.user);
    let notification = new Notifications({
      type: "welcome",
      user: request.user,
      content: `Your Request to join ${group.title} has been approved.`,
      image1: group.imgUrl,
    });
    await notification.save();
  },

  rejectRequest: async function (reqId) {
    await GroupRequests.findByIdAndDelete(reqId);
  },

  deleteGroup: async function (gId) {
    await PostGroups.findByIdAndDelete(gId); // Delete Group
    await GroupMembers.deleteMany({ gid: gId }); // Delete GroupMember
    await Posts.deleteMany({ group_id: gId }); // Delete Post
    await GroupRequests.deleteMany({ gid: gId }); // Delete Group Requests
  },
};
