import { Router } from "express";
import feedController from "../controllers/feedController.js";

const router = Router();

router.get("/getOfficialPosts/", async (req, res) => {
  let posts = await feedController.getOfficialWallPosts();
  return res.json(posts);
});

export default router;
