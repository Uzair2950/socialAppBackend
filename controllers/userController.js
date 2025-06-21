import {
  Students,
  Teachers,
  Users,
  Administrators,
  Friends,
  VipCollections,
  GroupMembers,
  PostGroups,
  ChatSettings,
} from "../database/models/models.js";
import notificationController from "./notificationController.js";

import postController from "./postController.js";

export default {
  isFriend: async function (uid, fid) {
    let res = await Friends.findOne({
      $or: [
        { uid: uid, friend_id: fid },
        { uid: fid, friend_id: uid },
      ],
      status: "accepted",
    }).lean();

    return res ? true : false;
  },

  authorizeUser: async function (email, password) {
    let user = await Users.findOne({ email, password }).select("_id").lean();

    // Invalid Username and password
    if (!user) return;

    // // get alerts
    // let notiCount = await notificationController.getUnreadNotificationCount(
    //   user._id
    // );

    // TODO: Add Message Count!
    return await this.getUserData(user._id);
  },
  getUserData: async function (uid) {
    return await Users.findById(uid).select("name type imgUrl").lean();
  },

  updateUser: async function (uid, data) {
    await Users.findByIdAndUpdate(uid, data);
  },

  getProfile: async function (uid, rid) {
    let user_data = await Users.findById(uid)
      .select(
        "-activeChats -groupChats -communityGroups -password -__v -email -uid"
      )
      .lean();
    let isSelf = uid == rid;
    let isFriend = await this.isFriend(uid, rid);
    let isPublic = !user_data.is_private;
    if (isSelf || isPublic || isFriend) {
      let friends = await this.getFriends(uid, true, 3);
      let posts = await postController.getPosts(
        uid,
        isSelf ? 2 : isFriend ? 1 : 0
      );

      return { ...user_data, friends, posts };
    } else {
      return { ...user_data };
    }
  },

  addFriend: async function (uid, fid) {
    let friend = new Friends({
      uid: uid,
      friend_id: fid,
    });

    await friend.save();
  },

  acceptRequest: async function (req_id) {
    await Friends.findByIdAndUpdate(req_id, { status: "accepted" });
  },

  rejectRequest: async function (req_id) {
    await Friends.findByIdAndDelete(req_id);
  },

  getPendingRequests: async function (uid) {
    return await Friends.find({ status: "pending", friend_id: uid })
      .select("uid")
      .populate("uid", "name imgUrl");
  },

  getFriends: async function (uid, splice = false, limit = 0) {
    // 1. Get Friends that were added by this user.

    let friends = await Friends.find({ status: "accepted", uid })
      .limit(limit)
      .populate("friend_id", "name imgUrl")
      .select("-_id friend_id");

    friends = friends.map((friend) => ({
      _id: friend.friend_id._id,
      name: friend.friend_id.name,
      imgUrl: friend.friend_id.imgUrl,
    }));

    if (splice) {
      if (limit == friends.length) return friends;
      else limit -= friends.length;
    }

    // 2. Get Friends who added this user.
    let friends2 = await Friends.find({ status: "accepted", friend_id: uid })
      .limit(limit)
      .populate("uid", "name imgUrl")
      .select("-_id uid");

    friends2 = friends2.map((friend) => ({
      _id: friend.uid._id,
      name: friend.uid.name,
      imgUrl: friend.uid.imgUrl,
    }));

    return [...friends, ...friends2];
  },

  getPeopleNotInVip: async function (uid) {
    let friends = await this.getFriends(uid);
    console.log(friends);
    // let vipCollectionIds = (await this.getVipCollection(uid))?.people.map((e) =>
    //   e._id.toString()
    // );
    // console.log(vipCollectionIds);
    // let notInVip = friends.filter(
    //   (e) => !vipCollectionIds.includes(e._id.toString())
    // );
    let inVipCollectons = (
      await VipCollections.find({ creator: uid }).select("person")
    ).map((e) => e.person.toString());

    let notInVip = friends.filter(
      (e) => !inVipCollectons.includes(e._id.toString())
    );

    return notInVip;
  },

  toggleAutoReply: async function (uid, chatId) {
    let user = await ChatSettings.findOne({ uid, chat: chatId });
    user.autoReply = !user.autoReply;
    await user.save();
  },

  getGroups: async function (uid) {
    let groups = await GroupMembers.find({ uid })
      .select("gid")
      .populate("gid", "name imgUrl");

    return groups.map((e) => e.gid);
  },

  // VIP Collection Handling
  ////////////////////////////////////////

  getVipCollections: async function (creator) {
    return await VipCollections.find({ creator })
      .select("-messages -__v")
      .populate("person", "name imgUrl")
      .lean();
  },

  createVipCollection: async function (creator, person) {
    let vipCollection = new VipCollections({
      creator,
      person,
    });
    await vipCollection.save();
    await vipCollection.populate("person", "name imgUrl");
    return { _id: vipCollection._id, person: vipCollection.person };
  },

  deleteVipCollection: async function (collection_id) {
    await VipCollections.findByIdAndDelete(collection_id);
  },

  // addPeopleInVipCollection: async function (collection_id, people) {
  //   await VipCollections.findByIdAndUpdate(collection_id, {
  //     $addToSet: { people: people },
  //   });
  // },

  // removeFromVipCollection: async function (collection_id, people) {
  //   await VipCollections.findByIdAndUpdate(collection_id, {
  //     $pullAll: { people: people },
  //   });
  // },

  getVipChat: async function (id) {
    let vipChat = await VipCollections.findById(id)
      .select("messages")
      .populate({
        path: "messages",
        select: "content attachments createdAt",
        populate: [
          {
            path: "senderId",
            select: "name imgUrl",
          },
        ],
        sort: { createdAt: -1 },
      })
      .lean();

    return {
      _id: vipChat._id,
      messages: vipChat.messages,
      totalParticipants: 0,
      isGroup: false,
      hasDownloads: false,
    };
  },

  getAdminGroups: async function (uid) {
    console.log(uid);
    let groups_ids = await PostGroups.find({ admins: uid }).select(
      "_id name imgUrl isOfficial"
    );
    return groups_ids;
  },
  getAllUsers: async function () {
    return await Users.find({}).select("name type imgUrl").lean();
  },
};
