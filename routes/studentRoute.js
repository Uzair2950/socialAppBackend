import express from "express";
import studentController from "../controllers/studentController.js";
import feedController from "../controllers/feedController.js";

const router = express.Router();

router.get("/getTimetable/:sid", async (req, res) => {
  return res.json(await studentController.getTimeTable(req.params.sid));
});

router.get("/getDateSheet/:sid", async (req, res) => {
  return res.json(await studentController.getDateSheet(req.params.sid));
});

router.get("/getClassWall/:uid", async (req, res) => {
  return res.json(await feedController.getClassWallPosts(req.params.uid));
});

export default router;
