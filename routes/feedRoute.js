import { Router } from "express";
import feedController from "../controllers/feedController.js";

const router = Router();

router.get("/getOfficialPosts/:uid", async (req, res) => {
  return res.json(await feedController.getOfficialWallPosts(req.params.uid));
});

router.get("/getClassWallPosts/:gid/:uid", async (req, res) => {
  return res.json(
    await feedController.getClassWallPosts(req.params.gid, req.params.uid)
  );
});

router.get("/getTeacherWallPosts/:uid", async (req, res) => {
  return res.json(await feedController.getTeachersWallPosts(req.params.uid));
});

router.get("/getSocialFeed/:uid", async (req, res) => {
  return res.json(await feedController.getSocialFeed(req.params.uid));
});

router.get("/getClassWallsData/:type/:uid", async (req, res) => {
  return res.json(
    await feedController.getClassWallsData(req.params.uid, req.params.type)
  );
});

router.get("/getClassPosts/:gid/:uid", async (req, res) => {
  return res.json(
    await feedController.getClassWallPosts(req.params.gid, req.params.uid)
  );
});

export default router;
