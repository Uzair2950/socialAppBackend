import { Router } from "express";
import notificationController from "../controllers/notificationController.js";

const router = Router();

router.get("/getUnreadNotifications/:uid", async (req, res) => {
  return res.json(
    await notificationController.getUnreadNotifications(req.params.uid)
  );
});

router.get("/getNotifications/:uid", async (req, res) => {
  return res.json(
    await notificationController.getNotifications(req.params.uid)
  );
});

router.post("/pushNotification/", async (req, res) => {
  let { user, actor, content, image1, image2 } = req.body;
  return res.json({
    id: await notificationController.addNotification(
      user,
      actor,
      content,
      undefined,
      image1,
      image2
    ),
  });
});

router.put("/markAsRead/:uid", async (req, res) => {
  return res.json(await notificationController.markAsRead(req.params.uid));
});

export default router;
