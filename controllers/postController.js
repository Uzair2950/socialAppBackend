import {
  Students,
  Teachers,
  Users,
  Administrators,
  Friends,
  Posts,
} from "../database/models/models.js";

export default {
  addPost: async function (author, type, privacyLevel, content, attachements) {
    let post = new Posts({
      author,
      type,
      content,
      attachements,
      privacyLevel,
    });
    await post.save();
  },

  getPosts: async function(uid, num) {
    let posts = await Posts.find({
      author: uid,
      type: 0, // Personal Posts
      privacyLevel: { $lte: num },
    });

    return posts
  },
};
