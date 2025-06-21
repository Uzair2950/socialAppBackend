import { Router } from "express";
import chatGroupController from "../controllers/chatGroupController.js";
import path from "path";
import multer, { diskStorage } from "multer";

const router = Router();

const destination = "/static/avatars";
const storage = diskStorage({
  destination: `.${destination}`,
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}_${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const attachments = multer({ storage });

router.get("/", (req, res) => res.send("Wow"));

/// ✅
router.get("/getGroupChat/:gid/:uid", async (req, res) => {
  return res.json(
    await chatGroupController.getGroupChat(req.params.gid, req.params.uid)
  );
});

/// ✅
router.get("/getAdmins/:gid", async (req, res) => {
  return res.json(await chatGroupController.getAdmins(req.params.gid));
});

/// ✅
router.get("/getMembers/:gid", async (req, res) => {
  return res.json(await chatGroupController.getParticipants(req.params.gid));
});

/// ✅
router.post(
  "/newGroupChat/:creatorId",
  attachments.single("group_avatar"),
  async (req, res) => {
    console.log(req.file);
    let chat_id = await chatGroupController.newGroupChat(
      req.params.creatorId,
      req.body.name,
      req.file ? `/${req.file?.path.replaceAll("\\", "/")}` : undefined,
      req.body.aboutGroup,
      req.body.allowChatting
    );
    return res.send({
      message: `GroupChat ${req.body.name} Created`,
      id: chat_id,
    });
  }
);

/// ✅

// router.put("/updateGroup/:gId", async (req, res) => {
//   await chatGroupController.updateGroupSettings(req.params.gId, req.body);
//   return res.json({ message: "Updated" });
// });
router.put(
  "/updateGroup/:gId",
  attachments.single("group_avatar"), // Handle single file upload
  async (req, res) => {
    try {
      const result = await chatGroupController.updateGroupSettings(
        req.params.gId,
        req.body,
        req.file
      );
      return res.json({ message: "Updated", success: true });
    } catch (error) {
      console.error("Update error:", error);
      return res.status(500).json({ message: "Update failed", success: false });
    }
  }
);

/// ✅
router.post("/addGroupAdmins/:gid", async (req, res) => {
  await chatGroupController.addAdmins(req.params.gid, req.body.admins);
  return res.json({ message: "Admins Added!" });
});

/// ✅

// MARK: --- NEW ROUTE
router.post("/removeAdmin/:gid/:uid", async (req, res) => {
  await chatGroupController.removeAdmin(req.params.gid, req.params.uid);
  return res.json({ message: "Admin Removed!" });
});

/// ✅
router.post("/joinGroup/:gid/:uid", async (req, res) => {
  await chatGroupController.addToGroupChat(req.params.gid, req.params.uid);
  return res.json({ message: "Group Joined!" });
});

// Kick / Leave
/// ✅
router.put("/removeMember/:gid/:uid", async (req, res) => {
  await chatGroupController.removeMember(req.params.gid, req.params.uid);
  return res.json({ message: "success" });
});

//Added by Uzair
router.get("/getGroupByChatId/:chatId", async (req, res) => {
  try {
    const group = await chatGroupController.getGroupByChatId(req.params.chatId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    return res.json(group);
  } catch (error) {
    console.error("Error in getGroupByChatId:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/getNonAdminMembers/:groupId", async (req, res) => {
  try {
    const members = await chatGroupController.getNonAdminMembers(
      req.params.groupId
    );
    return res.json(members);
  } catch (error) {
    console.error("Error in getNonAdminMembers route:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch non-admin members" });
  }
});
export default router;
