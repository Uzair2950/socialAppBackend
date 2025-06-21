import { Types } from "mongoose";
import {
  PostInteraction,
  GroupMembers,
  Posts,
  Enrollment,
  Allocation,
} from "../database/models/models.js";
import { getFriendsIds, aggregatePosts } from "../utils/utils.js";

export default {
  getOfficialWallPosts: async function (uid) {
    return await aggregatePosts(uid, "6797ebcc37200dbcdec36ba9");
  },

  getTeachersWallPosts: async function (uid) {
    return await aggregatePosts(uid, "67e0758ebb156fb388e84a10");
  },

  getClassWallPosts: async function (group_id, uid) {
    return await aggregatePosts(uid, group_id);
  },
  /*
    @type => type of user, (teacher / student)
    @uid => userid
  */
  getClassWallsData: async function (uid, type) {
    let collection = Enrollment;
    if (type != "student") collection = Allocation;

    let sections = await collection.aggregate([
      { $match: { student: new Types.ObjectId(uid) } },
      {
        $lookup: {
          from: "sections",
          foreignField: "_id",
          localField: "section",
          as: "sectionData",
          pipeline: [
            {
              $project: {
                _id: 1,
                title: 1,
                group: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$sectionData" },
      {
        $replaceRoot: { newRoot: "$sectionData" },
      },
      {
        $group: {
          _id: "$_id",
          title: { $first: "$title" },
          group: { $first: "$group" },
        },
      },
    ]);

    return sections;
  },

  // getSocialFeed: async function (uid) {
  //   let friendsIds = await getFriendsIds(uid);

  //   let getUserGroups = await GroupMembers.find({ uid }).select("gid -_id");

  //   let groupIds = getUserGroups.map((e) => e.gid);

  //   // Find posts that are by friends or in joined groups:
  //   // group_id: [] if post was in a group that u aren't a part of? but was posted by ur friend
  //   return await Posts.find({
  //     $or: [
  //       { author: friendsIds, group_id: [] },
  //       { group_id: { $in: groupIds } },
  //     ],
  //   })
  //     .select(
  //       "author content updatedAt allowCommenting likes comments attachments"
  //     )
  //     .populate([
  //       {
  //         path: "author",
  //         select: "name imgUrl",
  //       },
  //     ])
  //     .sort({
  //       updatedAt: -1,
  //     });
  // },
  // getSocialFeed: async function (uid) {
  //   let friendsIds = await getFriendsIds(uid);
  //   let userGroups = await GroupMembers.find({ uid }).select("gid -_id");
  //   let groupIds = userGroups.map((e) => e.gid);

  //   return await Posts.find({
  //     $or: [
  //       {
  //         $or: [
  //           { author: friendsIds },
  //           { author: new Types.ObjectId(uid) }, // Include user's own posts
  //         ],
  //       },
  //       { group_id: { $in: groupIds } },
  //     ],
  //   })
  //     .populate("author", "name imgUrl")
  //     .sort({ updatedAt: -1 })
  //     .limit(50);
  // },
  getSocialFeed: async function (uid) {
    const friendsIds = await getFriendsIds(uid);
    const userGroups = await GroupMembers.find({ uid }).select("gid -_id");
    const groupIds = userGroups.map((e) => e.gid);

    return await Posts.aggregate([
      {
        $match: {
          $or: [
            { author: { $in: friendsIds } },
            { author: new Types.ObjectId(uid) },
            { group_id: { $in: groupIds } },
          ],
        },
      },
      {
        $sort: { updatedAt: -1 },
      },
      {
        $limit: 2,
      },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorDetails",
        },
      },
      {
        $unwind: "$authorDetails",
      },
      {
        $lookup: {
          from: "postinteractions",
          localField: "_id",
          foreignField: "post",
          as: "postInteraction",
        },
      },
      {
        $unwind: {
          path: "$postInteraction",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          attachments: 1,
          type: 1,
          privacyLevel: 1,
          createdAt: 1,
          updatedAt: 1,
          author: {
            _id: "$authorDetails._id",
            name: "$authorDetails.name",
            imgUrl: "$authorDetails.imgUrl",
          },
          postInteraction: 1, // includes likes, comments, etc.
        },
      },
    ]);
  },
};
