import {
  Students,
  Teachers,
  Users,
  Administrators,
  Friends,
  Posts,
  AutoReply,
} from "../database/models/models.js";

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
    let user = await Users.findOne({ email, password }).lean();

    if (!user) return undefined;
    // TODO: select specific attributes not all..
    if (user.type == 0) {
      let student = await Students.findOne({ user: user._id }).lean();
      return { ...user, ...student };
    } else if (user.type == 1) {
      let teacher = await Teachers.findOne({ user: user._id }).lean();
      return { ...user, ...teacher };
    } else {
      let admin = await Administrators.findOne({ user: user._id }).lean();
      return { ...user, ...admin };
    }
  },

  updateUser: async function (uid, data) {
    await Users.findByIdAndUpdate(uid, data);
  },

  getProfile: async function (uid, rid) {
    let user_data = await Users.findById(uid).select(
      "-activeChats -groupChats -password"
    );
    let isSelf = uid == rid;
    let isFriend = await this.isFriend(uid, rid);
    let isPublic = !user_data.is_private;
    if (isSelf || isPublic || isFriend) {
      let friends = await this.getFriends(uid, true, 3);
      let posts = await postController.getPosts(
        uid,
        isSelf ? 2 : isFriend ? 1 : 0
      );

      return { user_data, friends, posts };
    } else {
      return { user_data };
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
      .populate("uid", "name avatarURL");
  },

  getFriends: async function (uid, splice = false, limit = 0) {
    // 1. Get Friends that were added by this user.
    let friends = await Friends.find({ status: "accepted", uid })
      .limit(limit)
      .populate("friend_id", "name avatarURL")
      .select("-_id friend_id");

    friends = friends.map((friend) => ({
      _id: friend.friend_id._id,
      name: friend.friend_id.name,
      avatarURL: friend.friend_id.avatarURL,
    }));

    if (splice) {
      if (limit == friends.length) return friends;
      else limit -= friends.length;
    }

    // 2. Get Friends who added this user.
    let friends2 = await Friends.find({ status: "accepted", friend_id: uid })
      .limit(limit)
      .populate("uid", "name avatarURL")
      .select("-_id uid");

    friends2 = friends2.map((friend) => ({
      _id: friend.uid._id,
      name: friend.uid.name,
      avatarURL: friend.uid.avatarURL,
    }));

    return [...friends, ...friends2];
  },

  toggleAutoReply: async function (uid) {
    let user = await Users.findById(uid);
    user.autoReply = !user.autoReply;
    await user.save();
  },

  addAutoReply: async function (uid, autoreplies) {
    let replies = await AutoReply.insertMany(
      autoreplies.map((e) => ({ user: uid, ...e }))
    );
    return replies;
  },

  removeAutoReply: async function (autoReplyId) {
    await AutoReply.findByIdAndDelete(autoReplyId);
  },

  getAutoReplies: async function (uid) {
    return await AutoReply.find({ user: uid });
  },
};
