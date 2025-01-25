import { Router } from "express";
import feedController from "../controllers/feedController.js";

const router = Router();

// MARK: --- NEW ROUTE
router.get("/getOfficialPosts/", async (req, res) => {
  return res.json(await feedController.getOfficialWallPosts());
});


// MARK: --- NEW ROUTE
router.get("/getClassWallPosts/:uid", async (req, res) => {
  return res.json(await feedController.getClassWallPosts(req.params.uid));
});

// MARK: --- NEW ROUTE
router.get("/getSocialFeed/:uid", async (req, res) => {
  return res.json(await feedController.getSocialFeed(req.params.uid));
});

export default router;
