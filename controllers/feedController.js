import { Posts } from "../database/models/models.js";

export default {
  getOfficialWallPosts: async function () {
    let posts = await Posts.find({ group_id: "676897d39d525ffb4eb6f5f8" })
      .select(
        "author is_pinned content updatedAt allowCommenting likes comments attachments"
      )
      .populate("author", "name avatarURL")
      .sort({ updatedAt: -1, is_pinned: -1 });

    return posts;
  },
};
