import { title } from "process";
import { Communities, CommunityMembers } from "../database/models/models.js";
import chatGroupController from "./chatGroupController.js";

export default {
  newCommunity: async function (createrId, title, imgUrl, aboutCommunity) {
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

  addGroupToCommunity: async function (cid, group_type, group_id) {
    await Communities.findByIdAndUpdate(cid, {
      $push: { groups: { gid: group_id, group_type } },
    });
  },

  addMember: async function (cid, uid) {
    await CommunityMembers.insertMany([
      {
        cid,
        uid,
      },
    ]);
  },

  getCommunity: async function (cid, requesterId) {
    let community = await Communities.findById(cid);
    let isMember = await CommunityMembers.findOne({ cid, uid: requesterId });

    if (!isMember) {
      return {
        title: community.title,
        imgUrl: community.imgUrl,
        totalGroups: community.groups.length,
        isMember: false,
      };
    }
    let isAdmin = community.communityAdmins.includes(requesterId);
    let isCreator = community.communityAdmins[0] == requesterId;

    await community.populate([
      { path: "groups.gid", select: "title imgUrl" },
      { path: "annoucementGroup", select: "title imgUrl" },
    ]);

    return { community, isAdmin, isCreator };
  },

  //TODO: Remove from community & leave community
};
