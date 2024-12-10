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
  addPost: async function (
    author,
    privacyLevel,
    content,
    attachements,
    group_id
  ) {
    let post = new Posts({
      author,
      group_id,
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

  pinPost: async function (postId) {
    let post = await Posts.findById(postId)

    console.log(post)

    // Case 1: The Post Being pinned is a "User Post" - Posted on a user's timeline
    let filter = { author: post.author, is_pinned: true };

    if (post.group_id) {
      // Case 2: The Post Being pinned is a "GroupPost"
      filter = { group_id: post.group_id, is_pinned: true };
    }
    // Unpin that post
    await Posts.updateMany(filter, { is_pinned: false });

    // Pin the new one
    post.is_pinned = true;
    await post.save();

    
  },

  unpinPost: async function (postId) {
    await Posts.findByIdAndUpdate(postId, { is_pinned: false });
  },

  likePost: async function (pid, uid) {
    await Posts.findByIdAndUpdate(pid, { $push: { likes: uid } });
  },

  addComment: async function (pid, author, content) {
    let comment = new Comments({ author, content });
    await comment.save();
    await Posts.findByIdAndUpdate(pid, {
      $push: { comments: comment._id },
    });
  },


  deletePost: async function(pid) {
    await Posts.findByIdAndDelete(pid)
  }
};
