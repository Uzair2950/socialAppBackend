import { Router } from "express";
import notificationController from "../controllers/notificationController.js";

const router = Router();


router.get("/getNotifications/:uid", async (req, res) => {
  return res.json(
    await notificationController.getNotifications(req.params.uid)
  );
});

router.put("/markAsRead/:uid", async (req, res) => {
  return res.json(await notificationController.markAsRead(req.params.uid));
});

export default router;
