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
// routes/postgroup.js or wherever you define group routes
router.get("/getAllGroups", async (req, res) => {
  try {
    const groups = await postgroupController.getAllGroups();
    return res.json(groups);
  } catch (err) {
    console.error("Error fetching groups:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});


// rId => requester ID
router.get("/getGroup/:gId/:rId", async (req, res) => {
  return res.json(
    await postgroupController.getGroup(req.params.gId, req.params.rId)
  );
});

router.post(
  "/createHybridGroup/:creatorId",
  groupAvatars.single("group_avatar"),
  async (req, res) => {
    console.log(req.body);
    await postgroupController.newHybribGroup(
      req.params.creatorId,
      req.body.name,
      req.file ? `/${req.file?.path.replaceAll("\\", "/")}` : undefined,
      req.body.aboutGroup,
      req.body.allowPosting,
      req.body.allowChatting,
      req.body.is_private
    );
    return res.send({ message: `Group ${req.body.name} Created` });
  }
);

router.post(
  "/createGroup/:creatorId",
  groupAvatars.single("group_avatar"),
  async (req, res) => {
    let group_id = await postgroupController.newGroup(
      req.params.creatorId,
      req.body.name,
      req.file ? `/${req.file?.path.replaceAll("\\", "/")}` : undefined,
      req.body.aboutGroup,
      req.body.allowPosting,
      req.body.is_private,
      req.body.isOfficial,
      req.body.isSociety
    );
    return res.send({ message: `Group ${req.body.name} Created`, group_id });
  }
);

// Add GroupChat to existing Posting Group
// ✅
router.post("/addGroupChat/:gid", async (req, res) => {
  await postgroupController.addChatGroup(req.params.gid);
  return res.json({ message: "Group Chat Added" });
});

// TESTING REQUIRED
// ✅
// router.put("/updateGroup/:gId", async (req, res) => {
//   await postgroupController.updateGroupSettings(req.params.gId, req.body);
//   return res.json({ message: "Updated" });
// });
router.put(
  "/updateGroup/:gId",
  groupAvatars.single("group_avatar"),
  async (req, res) => {
    try {
      await postgroupController.updateGroupSettings(
        req.params.gId,
        req.body,
        req.file
      );
      return res.json({ message: "Group updated successfully" });
    } catch (error) {
      console.error("Error updating group:", error);
      return res.status(500).json({ message: "Failed to update group" });
    }
  }
);

router.get("/getGroupMembers/:gid", async (req, res) => {
  console.log("Received request for group ID:", req.params.gid);
  try {
    const members = await postgroupController.getGroupMembers(req.params.gid);
    return res.json({ members });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to retrieve group members" });
  }
});

// ✅
router.post("/addGroupAdmins/:gid", async (req, res) => {
  await postgroupController.addAdmins(req.params.gid, req.body.admins);
  return res.json({ message: "Admins Added!" });
});

// ✅
// router.post("/joinGroup/:gid/:uid", async (req, res) => {
//   return res.json(
//     await postgroupController.joinGroup(req.params.gid, req.params.uid)
//   );
// });
router.post("/joinGroup/:gid/:uid", async (req, res) => {
  try {
    const response = await postgroupController.joinGroup(
      req.params.gid,
      req.params.uid
    );
    res.json(response);
  } catch (err) {
    console.error("Join Group Error:", err);
    res.status(500).json({ error: "Failed to join group" });
  }
});
router.post("/removeMember/:gid/:uid", async (req, res) => {
  try {
    await postgroupController.removeMembers(req.params.gid, req.params.uid);
    res.json({ message: "Member removed successfully" });
  } catch (err) {
    console.error("Remove Member Error:", err);
    res.status(500).json({ error: "Failed to remove member" });
  }
});
// Bulk add Users to group
// Body => Array of ids
// ✅
router.post("/addMembers/:gid", async (req, res) => {
  await postgroupController.bulkAddMembers(req.params.gid, req.body.members);
  return res.json({ message: req.body + "Added" });
});
// router.post("/addMembers/:gid", async (req, res) => {
//   try {
//     // 1. Validate input
//     if (!req.body.members || !Array.isArray(req.body.members)) {
//       return res.status(400).json({
//         success: false,
//         error: "Members array is required",
//       });
//     }

//     const result = await postgroupController.bulkAddMembers(
//       req.params.gid,
//       req.body.members
//     );
//     res.json({
//       success: true,
//       addedCount: result.length,
//       message: `Added ${result.length} members to group`,
//     });
//   } catch (error) {
//     console.error("Add members error:", error);
//     res.status(500).json({
//       success: false,
//       error: error.message || "Failed to add members",
//     });
//   }
// });
///////////////////

// Group Requests Handler
// ✅
router.get("/getPendingRequests/:gId", async (req, res) => {
  return res.json(await postgroupController.getPendingRequests(req.params.gId));
});

// ✅
router.post("/approveRequest/:reqId", async (req, res) => {
  await postgroupController.approveRequest(req.params.reqId);
  return res.json({ message: "success" });
});

// ✅
router.post("/rejectRequest/:reqId", async (req, res) => {
  await postgroupController.rejectRequest(req.params.reqId);
  return res.json({ message: "success" });
});

router.get("/getGroupAdmins/:gid", async (req, res) => {
  try {
    const response = await postgroupController.getGroupAdmins(req.params.gid);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: "Failed to get group admins" });
  }
});

router.delete("/deleteGroup/:gid", async (req, res) => {
  try {
    const groupId = req.params.gid;
    await postgroupController.deleteGroup(groupId);
    return res.json({ success: true, message: "Group deleted successfully." });
  } catch (error) {
    console.error("Error deleting group:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete group." });
  }
});

// Leave Group

// The Posting is handled by Posts-Routes

export default router;
