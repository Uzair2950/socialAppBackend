import { Notifications } from "../database/models/models.js";

export default {
  getUnreadNotificationCount: async function (uid) {
    return (await Notifications.find({ user: uid, isRead: false })).length;
  },
  getUnreadNotifications: async function (uid) {
    let notifications = await Notifications.find({
      user: uid,
      // isRead: false,
    })
      .populate('actor', '-_id name').select("content image1 image2 createdAt")
      .sort({ createdAt: -1 })
    let ids = notifications.map((e) => e._id);
    // update all notifiactions to them as Read

    // await Notifications.updateMany({ _id: ids }, { isRead: true });

    return notifications;
  },
  getNotifications: async function (uid) {
    return await Notifications.find({ user: uid });
  },

  markAsRead: async function (uid) {
    return await Notifications.updateMany({ user: uid }, { isRead: true });
  },

  addNotification: async function (
    user,
    actor,
    content,
    type,
    image1 = "",
    image2 = ""
  ) {
    let n = new Notifications({
      user,
      actor,
      content,
      type,
      image1,
      image2,
    });

    await n.save();

    return n._id;
  },
};
