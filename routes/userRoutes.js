import path from "path";
import express from "express";
import userController from "../controllers/userController.js";
import { validateRequest } from "zod-express-middleware";
import { z } from "zod";
import multer from "multer";
import { AutoReply } from "../database/models/models.js";
import feedController from "../controllers/feedController.js";

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
router.put(
  "/authorize",
  validateRequest({
    body: z.object({
      email: z.string(),
      password: z.string(),
    }),
  }),
  async (req, res) => {
    console.log(req.body);
    let user = await userController.authorizeUser(
      req.body.email,
      req.body.password
    );

    if (!user)
      return res.status(401).json({ message: "Invalid username or password!" });

    return res.send(user);
  }
);

router.get("/getUserData/:uid", async (req, res) => {
  let u = await userController.getUserData(req.params.uid);
  console.log(u);
  return res.json(u);
});

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

/*
          RELATIONSHIP HANDLER

*/
// ✅
router.get("/getFriends/:uid", async (req, res) => {
  return res.json(await userController.getFriends(req.params.uid));
});

// ✅
router.get("/getPendingRequests/:uid", async (req, res) => {
  return res.json(await userController.getPendingRequests(req.params.uid));
});

// ✅
router.post("/addFriend/:uid/:fid", async (req, res) => {
  await userController.addFriend(req.params.uid, req.params.fid);
  return res.json({ message: "Request Sent!" });
});

// ✅
router.post("/acceptRequest/:request_id", async (req, res) => {
  await userController.acceptRequest(req.params.request_id);
  return res.json({ message: "Request Accepted" });
});

// ✅
router.post("/rejectRequest/:request_id", async (req, res) => {
  await userController.rejectRequest(req.params.request_id);
  return res.json({ message: "Request Rejected" });
});

/*
      ==================================== GET USERPROFILE
*/

// ✅
router.get("/getProfile/:id/:requester_id", async (req, res) => {
  return res.json(
    await userController.getProfile(req.params.id, req.params.requester_id)
  );
});

// ✅


router.get("/getGroups/:uid", async (req, res) => {
  return res.json(await userController.getGroups(req.params.uid));
});

/*

  == AUTO-REPLY

*/
// ✅
router.post("/toggleAutoReply/:uid/:chatId", async (req, res) => {
  await userController.toggleAutoReply(req.params.uid, req.params.chatId);
  return res.json({ message: "success" });
});



// == VIP COLLECTION
// ✅


router.get("/getVipChat/:uid", async (req, res) => {
  return res.json(await userController.getVipChat(req.params.uid));
});

router.get("/getPeopleNotInCollection/:uid", async (req, res) => {
  return res.json(await userController.getPeopleNotInVip(req.params.uid))
})


router.get("/getVipCollection/:uid", async (req, res) => {
  return res.json(await userController.getVipCollection(req.params.uid));
});


router.post("/createVipCollection/:uid", async (req, res) => {
  return res.json({
    id: await userController.createVipCollection(
      req.params.uid,
      req.body.people
    ),
  });
});

// ✅

router.delete("/deleteVipCollection/:collection_id", async (req, res) => {
  await userController.deleteVipCollection(req.params.collection_id);
  return res.json({
    success: true,
  });
});

// ✅

router.put("/addPeopleInCollection/:collection_id", async (req, res) => {
  await userController.addPeopleInVipCollection(
    req.params.collection_id,
    req.body.people
  );
  console.log(req.body)
  return res.json({ message: "success" });
});

// ✅

router.put("/removePeopleFromCollection/:collection_id", async (req, res) => {
  await userController.removeFromVipCollection(
    req.params.collection_id,
    req.body.people
  );
  return res.json({ message: "success" });
});

router.get("/getAdminGroups/:uid", async (req, res) => {
  return res.json(await userController.getAdminGroups(req.params.uid))
});

export default router;
