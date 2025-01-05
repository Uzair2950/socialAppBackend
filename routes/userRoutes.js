import path from "path";
import express from "express";
import userController from "../controllers/userController.js";
import { validateRequest } from "zod-express-middleware";
import { z } from "zod";
import multer from "multer";
import { AutoReply } from "../database/models/models.js";

const storage = multer.diskStorage({
  destination: "./static/avatars",
  filename: function (req, file, cb) {
    console.log(file);
    cb(null, req.params.id + path.extname(file.originalname));
  },
});

const avatarsUpload = multer({ storage });

const router = express.Router();

//Routes

// Authorize User {username, password}
router.post(
  "/authorize",
  validateRequest({
    body: z.object({
      email: z.string(),
      password: z.string(),
    }),
  }),
  async (req, res) => {
    let user = await userController.authorizeUser(
      req.body.email,
      req.body.password
    );

    if (!user)
      return res.status(401).json({ message: "Invalid username or password!" });

    return res.send(user);
  }
);

router.get("/", (req, res) => {
  return res.send("Wow");
});

/*

      ==================================== USER PROFILE UPDATE

*/

// ✅
router.put(
  "/updateProfileName/:id", // Document ID
  validateRequest({
    body: z.object({
      name: z.string(),
    }),
  }),
  async (req, res) => {
    await userController.updateUser(req.params.id, { name: req.body.name });
    return res.json({
      message: `Updated Name ${req.body.name} against ${req.params.id}`,
    });
  }
);

// Bio / About
// ✅
router.put(
  "/updateProfileBio/:id",
  validateRequest({
    body: z.object({
      bio: z.string(),
    }),
  }),
  async (req, res) => {
    await userController.updateUser(req.params.id, { bio: req.body.bio });

    return res.json({
      message: `Updated Bio ${req.body.bio} against ${req.params.id}`,
    });
  }
);

// Visibility / Privacy => is_private;
// ✅
router.put(
  "/updateVisibility/:id",
  validateRequest({
    body: z.object({
      is_private: z.boolean(),
    }),
  }),
  async (req, res) => {
    await userController.updateUser(req.params.id, {
      is_private: req.body.is_private,
    });
    return res.json({
      message: `Updated Privacy ${req.body.is_private} against ${req.params.id}`,
    });
  }
);

// Update Avatar
// Frontend handling => if avatarURL is empty, use the default avatarURL.
// ✅
router.put(
  "/updateAvatar/:id",
  avatarsUpload.single("avatar"),
  async (req, res) => {
    await userController.updateUser(req.params.id, {
      avatarURL: `/static/avatars/${req.params.id}${path.extname(
        req.file.originalname
      )}`,
    });

    return res.json({
      message: `Avatar Updated Successfully!`,
    });
  }
);

/*
          RELATIONSHIP HANDLER

*/

router.get("/getFriends/:uid", async (req, res) => {
  return res.json(await userController.getFriends(req.params.uid));
});

router.get("/getPendingRequests/:uid", async (req, res) => {
  return res.json(await userController.getPendingRequests(req.params.uid));
});

router.post("/addFriend/:uid/:fid", async (req, res) => {
  await userController.addFriend(req.params.uid, req.params.fid);
  return res.json({ message: "Request Sent!" });
});

router.post("/acceptRequest/:request_id", async (req, res) => {
  await userController.acceptRequest(req.params.request_id);
  return res.json({ message: "Request Accepted" });
});

/*
      ==================================== GET USERPROFILE
*/

router.get("/getProfile/:id/:requester_id", async (req, res) => {
  return res.json(
    await userController.getProfile(req.params.id, req.params.requester_id)
  );
});

/*

  == AUTO-REPLY

*/

router.post("/toggleAutoReply/:uid", async (req, res) => {
  await userController.toggleAutoReply(req.params.uid);
  return res.json({ message: "success" });
});

router.get("/getAutoReplies/:uid", async (req, res) => {
  return res.json(await userController.getAutoReplies(req.params.uid));
});

router.post("/addAutoReply/:uid", async (req, res) => {
  let autoReply = await userController.addAutoReply(req.params.uid, req.body);

  return res.json({ autoReply, message: "success" });
});

router.delete("/removeAutoReply/:id", async (req, res) => {
  await userController.removeAutoReply(req.params.id);
  return res.json({ message: "success" });
});

// VIP

router.get("/getVipChat/:uid", async (req, res) => {
  return res.json(await userController.getVipChat(req.params.uid));
});

export default router;
