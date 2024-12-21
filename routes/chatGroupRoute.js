import { Router } from "express";
import chatGroupController from "../controllers/chatGroupController.js";

const router = Router();

router.get("/", (req, res) => res.send("Wow"));

router.get("/getGroupChat/:gid/:uid", async (req, res) => {
  return res.json(
    await chatGroupController.getGroupChat(req.params.gid, req.params.uid)
  );
});

router.get("/getAdmins/:gid", async (req, res) => {
  return res.json(await chatGroupController.getAdmins(req.params.gid));
});

router.get("/getMembers/:gid", async (req, res) => {
  return res.json(await chatGroupController.getParticipants(req.params.gid));
});

//TODO: ADD THE IMAGE
router.post("/newGroupChat/:creatorId", async (req, res) => {
  await chatGroupController.newGroupChat(
    req.params.creatorId,
    req.body.title,
    req.body.imgUrl,
    req.body.aboutGroup,
    req.body.allowChatting
  );
  return res.send({ message: `GroupChat ${req.body.title} Created` });
});

// TESTING REQUIRED
router.put("/updateGroup/:gId", async (req, res) => {
  await chatGroupController.updateGroupSettings(req.params.gId, req.body);
  return res.json({ message: "Updated" });
});

router.post("/addGroupAdmins/:gid", async (req, res) => {
  await chatGroupController.addAdmins(req.params.gid, req.body.admins);
  return res.json({ message: "Admins Added!" });
});

router.post("/joinGroup/:gid/:uid", async (req, res) => {
  await chatGroupController.addToGroupChat(req.params.gid, req.params.uid);
  return res.json({ message: "Group Joined!" });
});

// Kick / Leave
router.put("/removeMember/:gid/:uid", async (req, res) => {
  await chatGroupController.removeMember(req.params.gid, req.params.uid);
  return res.json({ message: "success" });
});

export default router;
