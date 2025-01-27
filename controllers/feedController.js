import { Friends, GroupMembers, Posts } from "../database/models/models.js";
import { getFriendsIds } from "../utils/utils.js";
import studentController from "./studentController.js";
import userController from "./userController.js";

export default {
  getOfficialWallPosts: async function () {
    let posts = await Posts.find({ group_id: "6797ebcc37200dbcdec36ba9" })
      .select(
        "author is_pinned content updatedAt allowCommenting likes comments attachments"
      )
      .populate("author", "name avatarURL")
      .sort({ updatedAt: -1, is_pinned: -1 });

    return posts;
  },

  getClassWallPosts: async function (uid) {
    let group_id = await studentController.getClassGroupId(uid);
    let posts = await Posts.find({ group_id: group_id })
      .select(
        "author is_pinned content updatedAt allowCommenting likes comments attachments"
      )
      .populate("author", "name avatarURL")
      .sort({ updatedAt: -1, is_pinned: -1 });

    return posts;
  },

  getSocialFeed: async function (uid) {
    let friendsIds = await getFriendsIds(uid);

    let getUserGroups = await GroupMembers.find({ uid }).select("gid -_id");

    let groupIds = getUserGroups.map((e) => e.gid);

    // Find posts that are by friends or in joined groups:
    // group_id: [] if post was in a group that u weren't a part of? but was posted by ur friend
    return await Posts.find({
      $or: [
        { author: friendsIds, group_id: [] },
        { group_id: { $in: groupIds } },
      ],
    })
      .select(
        "author content updatedAt allowCommenting likes comments attachments"
      )
      .populate([
        {
          path: "author",
          select: "name avatarURL",
        },
      ])
      .sort({
        updatedAt: -1,
      });
  },
};
