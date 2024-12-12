import { Router } from "express";
import communityController from "../controllers/communityController.js";

const router = Router();

router.get("/", (req, res) => res.send("Y"));

router.post("/newCommunity/:createrId", async (req, res) => {
  let id = await communityController.newCommunity(
    req.params.createrId,
    req.body.title,
    req.body.imgUrl,
    req.body.about
  );
  return res.json({ id, message: "Community Created!" });
});

router.post("/addGroup/:cid", async (req, res) => {
  await communityController.addGroupToCommunity(
    req.params.cid,
    req.body.type,
    req.body.gid
  );
  return res.json({ message: "success" });
});

router.post("/addMember/:cid/:uid", async (req, res) => {
  await communityController.addMember(req.params.cid, req.params.uid);
  return res.json({ message: "success" });
});

router.get("/getCommunity/:cid/:rid", async (req, res) => {
  return res.json(
    await communityController.getCommunity(req.params.cid, req.params.rid)
  );
});

export default router;
