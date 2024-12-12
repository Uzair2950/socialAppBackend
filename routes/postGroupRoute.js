import path from "path";
import express from "express";
import multer from "multer";
import { z } from "zod";
import postgroupController from "../controllers/postgroupController.js";
import chatGroupController from "../controllers/chatGroupController.js";

const storage = multer.diskStorage({
  destination: "./static/avatars",
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}_${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const groupAvatars = multer({ storage });
const router = express.Router();

// Middle Ware
const createGroupSchema = z.object({
  title: z.string(), // Add check on frontend..
  imgUrl: z.string().default("/static/avatars/default_group.png"),
  is_private: z.boolean().default(false),
  aboutGroup: z.string().default(""),
  allowPosting: z.boolean().default(true),
});

const validateRequest = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse({
      ...req.body, // Include the request body
    });
    req.body = validatedData; // Replace req.body with validated and default-applied data
    next();
  } catch (err) {
    res.status(400).send(err.errors || "Invalid request");
  }
};
///////////////////////////////////////////////////////////////////

// Routes

router.get("/", (req, res) => res.json({ message: "OK" }));

// rId => requester ID
router.get("/getGroup/:gId/:rId", async (req, res) => {
  return res.json(
    await postgroupController.getGroup(req.params.gId, req.params.rId)
  );
});

router.post(
  "/createHybridGroup/:creatorId",
  async (req, res) => {


    await postgroupController.newGroup(
      req.params.creatorId,
      req.body.title,
      req.body.imgUrl,
      req.body.aboutGroup,
      req.body.allowPosting,
      req.body.is_private
    );
    return res.send({ message: `Group ${req.body.title} Created` });
  }
);

router.post(
  "/createGroup/:creatorId",
  validateRequest(createGroupSchema),
  async (req, res) => {
    await postgroupController.newGroup(
      req.params.creatorId,
      req.body.title,
      req.body.imgUrl,
      req.body.aboutGroup,
      req.body.allowPosting,
      req.body.is_private
    );
    return res.send({ message: `Group ${req.body.title} Created` });
  }
);

// Add GroupChat to existing Posting Group
router.post("/addGroupChat/:gid", async (req, res) => {
  await postgroupController.addChatGroup(req.params.gid);
  return res.json({ message: "Group Chat Added" });
});

// TESTING REQUIRED
router.put("/updateGroup/:gId", async (req, res) => {
  await postgroupController.updateGroupSettings(req.params.gId, req.body);
  return res.json({ message: "Updated" });
});

router.post("/addGroupAdmins/:gid", async (req, res) => {
  await postgroupController.addAdmins(req.params.gid, req.body.admins);
  return res.json({ message: "Admins Added!" });
});

router.post("/joinGroup/:gid/:uid", async (req, res) => {
  return res.json(
    await postgroupController.joinGroup(req.params.gid, req.params.uid)
  );
});

// Bulk add Users to group
// Body => Array of ids
router.post("/addMembers/:gid", async (req, res) => {
  await postgroupController.bulkAddMembers(req.params.gid, req.body.members);
  return res.json({ message: req.body + "Added" });
});

///////////////////

// Group Requests Handler
router.get("/getPendingRequests/:gId", async (req, res) => {
  return res.json(await postgroupController.getPendingRequests(req.params.gId));
});

router.post("/approveRequest/:reqId", async (req, res) => {
  await postgroupController.approveRequest(req.params.reqId);
  return res.json({ message: "success" });
});

router.post("/rejectRequest/:reqId", async (req, res) => {
  await postgroupController.rejectRequest(req.params.reqId);
  return res.json({ message: "success" });
});

// The Posting is handled by Posts-Routes

export default router;
