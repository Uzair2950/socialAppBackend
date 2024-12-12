import { Notifications } from "../database/models/models.js";

export default {
  getNotifications: async function (uid) {
    return await Notifications.find({ user: uid });
  },

  markAsRead: async function (uid) {
    return await Notifications.updateMany({ user: uid }, { isRead: true });
  },

  addNotification: async function (
    user,
    content,
    type,
    image1 = "",
    image2 = ""
  ) {
    let n = new Notifications({
      user,
      content,
      type,
      image1,
      image2,
    });

    await n.save();
  },
};
