import {
  Posts,
  Comments,
  TimeTable,
  PostInteraction,
} from "../database/models/models.js";
import { Types } from "mongoose";
import { getCurrentSession } from "../utils/utils.js";
import { parseTimetable } from "../xlparser.js";

import { Filter } from "bad-words";

export default {
  addPost: async function (
    author,
    privacyLevel,
    content,
    attachments,
    group_ids = [], // can be multiple groups
    type,
    allowCommenting,
    postOnTimeline
  ) {
    let filter = new Filter();

    let post = new Posts({
      author,
      content: filter.clean(content), // MARK: Language Filter
      attachments,
      privacyLevel,
      allowCommenting,
      type,
    });
    //  type = 0 (default)
    if (type == 1) {
      // Timetable
      if (attachments.length > 0 && attachments[0].split(".")[1] == "xlsx") {
        let timetable = await parseTimetable(attachments[0]);
        if (timetable) {
          // Delete old
          let session = (await getCurrentSession())._id;
          await TimeTable.deleteMany({ session });
          await TimeTable.insertMany(Object.values(timetable));
        }
      } else {
        console.log("Invalid File");
        return { message: "Invalid Timetable File!" };
      }
      // TODO: Add Datesheet
    } else if (type == 2) {
    }

    let interactions = group_ids.map((e) => ({
      post: post._id,
      poster: author,
      group_id: e,
      allowCommenting,
    }));

    if (postOnTimeline) {
      interactions.push({
        post: post._id,
        poster: author,
        group_id: null,
        allowCommenting,
      });
    }

    await post.save();
    let ids = (await PostInteraction.insertMany(interactions)).map(
      (e) => e._id
    );
    console.log(ids);
    return ids;
  },

  getPosts: async function (uid, num) {
    // let posts = await Posts.find({
    //   author: uid,
    //   privacyLevel: { $lte: num },
    //   group_id: [],
    // })
    //   .populate("author", "name imgUrl")
    //   .sort({ /* is_pinned: -1,*/ updatedAt: -1 }); // TODO: Fix Pin Logic
    let posts = await PostInteraction.aggregate([
      {
        $match: {
          $and: [{ poster: new Types.ObjectId(uid) }, { group_id: null }],
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "post",
          foreignField: "_id",
          as: "postData",
          pipeline: [
            { $match: { privacyLevel: { $lte: num } } },
            {
              $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "authorData",
              },
            },
            { $unwind: "$authorData" },
            {
              $project: {
                _id: 1,
                content: 1,
                attachments: 1,
                createdAt: 1,
                type: 1,
                is_pinned: 1,
                "authorData._id": 1,
                "authorData.name": 1,
                "authorData.imgUrl": 1,
              },
            },
          ],
        },
      },
      { $unwind: "$postData" },
      {
        $project: {
          _id: 1,
          group_id: 1,
          postData: 1,
          allowCommenting: 1,
          hasLiked: { $in: [new Types.ObjectId(uid), "$likes"] },
          is_pinned: 1,
          commentCount: { $size: "$comments" },
          likesCount: { $size: "$likes" },
          isAuthor: {
            $eq: ["$postData.authorData._id", new Types.ObjectId(uid)],
          },
        },
      },
      { $sort: { is_pinned: -1, "postData.createdAt": -1 } },
    ]);
    return posts;
  },

  // pinPost: async function (postId) {
  //   let post = await Posts.findById(postId);
  //   // Case 1: The Post Being pinned is a "User Post" - Posted on a user's timeline
  //   let filter = { author: post.author, is_pinned: true };

  //   if (post.group_id) {
  //     // Case 2: The Post Being pinned is a "GroupPost"
  //     filter = { group_id: post.group_id, is_pinned: true };
  //   }
  //   // Unpin that post
  //   await Posts.updateMany(filter, { is_pinned: false });

  //   // Pin the new one
  //   post.is_pinned = true;
  //   await post.save();
  // },

  // unpinPost: async function (postId) {
  //   await Posts.findByIdAndUpdate(postId, { is_pinned: false });
  // },

  togglePostPin: async function (pid, uid, group_id, expiryTime, currentState) {
    // /*
    //  if currentState == true: Post was previously pinned
    // */
    // // Unpin
    // if (currentState) {
    //   // postId shouldn't be required??? since each group can have only one pinned post..
    //   if (group_id)
    //     // Was Pinned in group, since admins can unpin posts too so..
    //     await PinnedPosts.deleteOne({ group_id });
    //   else await PinnedPosts.deleteOne({ pinnedBy: uid }); // Pinned at profile
    //   return { sucess: true, message: "Post unpinned sucessfully!" };
    // }
    // // Pin
    // if (group_id) {
    //   // Unpin  previously pinned post in a "group"
    //   await PinnedPosts.deleteMany({ group_id });
    // }
    // // If group_id is undefined then it's probably being called from user's profile
    // else {
    //   // Unpin  previously pinned post in user's profile
    //   await PinnedPosts.deleteMany({ pinnedBy: uid, group_id: null });
    // }
    // // This works
    // // Now finally pin the post
    // let pin = new PinnedPosts({
    //   pinnedBy: uid,
    //   post: pid,
    //   group_id,
    //   expireAfter: expiryTime,
    // });
    // await pin.save();
    // return { sucess: true, message: "Post pinned sucessfully!", id: pin._id };
  },

  // likePost: async function (pid, uid) {
  //   await Posts.findByIdAndUpdate(pid, { $push: { likes: uid } });
  // },

  // unlikePost: async function (pid, uid) {
  //   await Posts.findByIdAndUpdate(pid, { $pull: { likes: uid } });
  // },

  togglePostLike: async function (postInteractionId, uid, state) {
    let property = state == "true" ? "$pull" : "$push";

    await PostInteraction.findByIdAndUpdate(postInteractionId, {
      [property]: { likes: new Types.ObjectId(uid) },
    });

    return !state;
  },

  addComment: async function (pid, author, content) {
    let comment = new Comments({ author, content });
    await comment.save();
    await PostInteraction.findByIdAndUpdate(pid, {
      $push: { comments: comment._id },
    });
  },

  toggleCommenting: async function (pid) {
    let post = await PostInteraction.findById(pid);
    post.allowCommenting = !post.allowCommenting;
    await post.save();
  },

  getComments: async function (pid, uid) {
    // let comments = await PostInteraction.findById(pid)
    //   .select("comments")
    //   .populate({
    //     path: "comments",
    //     select: "content likesCount",
    //     populate: [
    //       { path: "author", select: "name imgUrl" },
    //       { path: "likes", select: "_id", match: { _id: uid } },
    //     ],
    //   });

    let comments = await PostInteraction.aggregate([
      { $match: { _id: new Types.ObjectId(pid) } },
      {
        $lookup: {
          from: "comments",
          localField: "comments",
          foreignField: "_id",
          as: "commentsData",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "authorData",
              },
            },
            { $unwind: "$authorData" },
            {
              $project: {
                "authorData._id": 1,
                "authorData.name": 1,
                "authorData.imgUrl": 1,
                hasLiked: { $in: [new Types.ObjectId(uid), "$likes"] },
                content: 1,
                likesCount: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          commentsData: 1,
        },
      },
      { $unwind: "$commentsData" }, // Flatten the commentsData array
      { $replaceRoot: { newRoot: "$commentsData" } }, // Replace root with commentsData
    ]);

    return comments;
  },

  toggleCommentInteraction: async function (commentId, uid, state) {
    // State is string...
    let property = state == "false" ? "$push" : "$pull";
    let value = state == "false" ? 1 : -1;
    await Comments.findByIdAndUpdate(commentId, {
      $inc: { likesCount: value },
      [property]: { likes: new Types.ObjectId(uid) },
    });
  },

  changeVisibility: async function (pId, vis) {
    await Posts.findByIdAndUpdate(pId, { privacyLevel: vis });
  },

  editPost: async function (pid, data) {
    await Posts.findByIdAndUpdate(pid, data);
  },

  deletePost: async function (pid) {
    await Posts.findByIdAndDelete(pid);
  },
};
