import { Communities, CommunityMembers, Users, GroupMembers, ChatGroups } from "../database/models/models.js";
import { getRandomThree, selectPostGroups, selectGroupChats } from "../utils/utils.js";
import chatGroupController from "./chatGroupController.js";
import { difference, intersection } from "set-operations";
import { Types } from "mongoose";

export default {
  newCommunity: async function (createrId, title, imgUrl = "/static/avatars/default_community.png", aboutCommunity) {
    let annoucementGroup = await chatGroupController.newGroupChat(
      createrId,
      "Annoucements",
      "/static/avatars/annoucement_channel.png",
      "",
      false,
      true
    );



    let community = new Communities({
      communityAdmins: [createrId],
      title,
      imgUrl,
      annoucementGroup,
      aboutCommunity,
    });

    await community.save();
    await this.addMember(community._id, createrId);
    return community._id;
  },

  addAdmins: async function (cid, admins) {
    await Communities.findByIdAndUpdate(cid, {
      $addToSet: { communityAdmins: admins },
    });
  },

  removeAdmins: async function (cid, admins) {
    await Communities.findByIdAndUpdate(cid, {
      $pullAll: { communityAdmins: admins },
    });
  },

  /*
  @params => group_type [postgroup, chatgroup]!
  */
  addGroupToCommunity: async function (cid, group_type, group_id) {
    // await Communities.findByIdAndUpdate(cid, {
    //   $push: { groups: { gid: group_id, group_type } },
    // });
    await Communities.findByIdAndUpdate(cid, {
      $push: { [group_type]: group_id }
    })
  },

  addMember: async function (cid, uid) {
    await CommunityMembers.insertMany([
      {
        cid,
        uid,
      },
    ]);
  },

  // getCommunity: async function (cid, requesterId) {
  //   let community = await Communities.findById(cid).select("-__v");
  //   let isMember = await CommunityMembers.findOne({ cid, uid: requesterId });

  //   if (!isMember) {
  //     return {
  //       title: community.title,
  //       imgUrl: community.imgUrl,
  //       totalGroups: community.groups.length,
  //       isMember: false,
  //     };
  //   }

  //   let isAdmin = community.communityAdmins.includes(requesterId);
  //   let isCreator = community.communityAdmins[0] == requesterId;

  //   await community.populate([
  //     { path: "groups.gid", select: "name imgUrl" },
  //     { path: "annoucementGroup", select: "name imgUrl" },
  //   ]);

  //   return { community, isAdmin, isCreator };
  // },

  getCommunities: async function (uid) {
    let joinedCommunityIds = (await CommunityMembers.find({ uid }).select("-_id cid"))?.map(e => e.cid)
    if (joinedCommunityIds.length == 0) return []
    let communities = Communities.find({ _id: joinedCommunityIds }).select("title imgUrl aboutCommunity annoucementGroup")
    return communities;
  },
  getCommunity: async function (cid, requesterId) {
    let community = await Communities.findById(cid).select("-__v");
    let isMember = await CommunityMembers.findOne({ cid, uid: requesterId });


    if (!isMember) {
      return {
        title: community.title,
        imgUrl: community.imgUrl,
        totalGroups: community.postgroup.length + community.chatgroup.length,
        isMember: false,
      };
    }

    let usersChatsGroups = (await Users.findById(requesterId).select("-_id groupChats communityGroups"))
    usersChatsGroups = [...usersChatsGroups.communityGroups.map(String), ...usersChatsGroups.groupChats.map(String)]

    let userPostGroups = (await GroupMembers.find({ uid: requesterId }).select("-_id gid")).map(e => e.gid.toString())


    let communityGroupChats = community.chatgroup.map(String)
    let communityPostGroups = community.postgroup.map(String)

    let excludedChatGroupIds = difference(communityGroupChats, usersChatsGroups).splice(0, 3) // User exists in these chats
    let excludedPostGroupIds = difference(communityPostGroups, userPostGroups).splice(0, 3)

    let joinedGroupChatsIds = intersection(communityGroupChats, usersChatsGroups).splice(0, 3)
    let joinedPostGroupIds = intersection(communityPostGroups, userPostGroups).splice(0, 3)


    let [excludedChatGroup, joinedGroupChats] = await Promise.all([
      selectGroupChats(excludedChatGroupIds, "name imgUrl chat"),
      selectGroupChats(joinedGroupChatsIds, "name imgUrl chat")
    ])

    let [excludedPostGroup, joinedPostGroup] = await Promise.all([
      selectPostGroups(excludedPostGroupIds, "name imgUrl"),
      selectPostGroups(joinedPostGroupIds, "name imgUrl")
    ])

    let excludedGroups = getRandomThree([...excludedChatGroup, ...excludedPostGroup])
    let includedGroups = getRandomThree([...joinedGroupChats, ...joinedPostGroup])

    let isAdmin = community.communityAdmins.includes(requesterId);
    let isCreator = community.communityAdmins[0] == requesterId;

    let comms = (await Communities.aggregate([
      { $match: { _id: new Types.ObjectId(cid) } },
      {
        $lookup: {
          from: "chatgroups",
          localField: "annoucementGroup",
          foreignField: "_id",
          as: "annoucementGroup",
          pipeline: [
            {
              $lookup: {
                from: "chats",
                localField: "chat",
                foreignField: "_id",
                as: "chatData"
              }
            },
            { $unwind: { path: "$chatData", preserveNullAndEmptyArrays: true } },
            {
              $set: {
                lastMessage: { $last: "$chatData.messages" }
              }
            },
            {
              $lookup: {
                from: "messages",
                localField: "lastMessage",
                foreignField: "_id",
                as: "lastMessage"
              },
            },
            { $unwind: "$lastMessage" },
            {
              $lookup: {
                from: "users",
                localField: "lastMessage.senderId",
                foreignField: "_id",
                as: "lastMessage.senderId"
              },
            },
            { $unwind: "$lastMessage.senderId" },
            {
              $project: {
                _id: 0,
                "chat": 1,
                "lastMessage.senderId": "$lastMessage.senderId._id",
                "lastMessage.senderName": "$lastMessage.senderId.name",
                "lastMessage.content": 1,
                "lastMessage.attachments": 1,
                "lastMessage.createdAt": 1,
              }
            },
          ]
        },
      },
      { $unwind: { path: "$annoucementGroup", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          title: 1,
          imgUrl: 1,
          aboutCommunity: 1,
          "annoucementGroup": "$annoucementGroup.chat",
          lastMessage: "$annoucementGroup.lastMessage", // Move lastMessage to root,
        }
      }
    ]))[0];

    let memberCount = await CommunityMembers.countDocuments({ cid })

    if (!Object.keys(comms).includes("lastMessage")) {
      comms = { ...comms, lastMessage: null, annoucementGroup: (await ChatGroups.findById(community.annoucementGroup).select("chat")).chat }
    }

    return { ...comms, memberCount, excludedGroups, includedGroups, isAdmin, isCreator, isMember: true };
  },



  leaveCommunity: async function (cid, uid) {
    // Remove as admin if found
    await Communities.findByIdAndUpdate(cid, {
      $pull: { communityAdmins: uid },
    });
    await CommunityMembers.deleteOne({ cid, uid });
  },
};
