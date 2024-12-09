import {
  Students,
  Teachers,
  Users,
  Administrators,
  Friends,
  Posts,
  Comments,
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

  getPosts: async function (uid, num) {
    let posts = await Posts.find({
      author: uid,
      type: 0, // Personal Posts
      privacyLevel: { $lte: num },
    });

    return posts;
  },

  likePost: async function (pid, uid) {
    await Posts.findByIdAndUpdate(pid, { $push: { likes: uid } });
  },

  addComment: async function (pid, author, content) {
    let comment = new Comments({ author, content });
    await comment.save();
    await Posts.findByIdAndUpdate(pid, { $push: { comments: uid } });
  },
};
