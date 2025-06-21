import { Router } from "express";
import chatController from "../controllers/chatController.js";
import path from "path";
import multer, { diskStorage } from "multer";

const router = Router();

const destination = "/static/messages";
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

const messageAttchments = multer({ storage });

router.get("/", (req, res) => {
  return res.send({ message: "Test" });
});

// ✅
router.post("/initiateChat/:sender/:receiver", async (req, res) => {
  return res.json({
    message: "success",
    id: await chatController.initiateChat(
      req.params.sender,
      req.params.receiver
    ),
  });
});

// ✅
router.get("/getChat/:cid/:uid/:messageCount", async (req, res) => {
  return res.json(
    await chatController.getChat(
      req.params.cid,
      req.params.uid,
      parseInt(req.params.messageCount)
    )
  );
});

router.get("/getChats_short/:uid", async (req, res) => {
  return res.json(await chatController.getAllChats_short(req.params.uid));
});

// ✅
router.get("/getChatSettings/:chat/:uid", async (req, res) => {
  return res.json(
    await chatController.getChatSettings(req.params.chat, req.params.uid)
  );
});

// ✅
router.get("/getAllChats/:uid", async (req, res) => {
  return res.json(await chatController.getAllChats(req.params.uid));
});

// ✅
router.get("/getMessage/:mid/:uid", async (req, res) => {
  return res.json(
    await chatController.getMessage(req.params.mid, req.params.uid)
  );
});

// ✅
router.post(
  "/sendMessage/:cid",
  messageAttchments.array("attachments"),
  async (req, res) => {
    let message_id = await chatController.sendMessage(
      req.params.cid,
      req.body.senderId,
      req.body.content,
      req.files?.map((e) => `${destination}/${e.filename}`),
      req.body.isReply,
      req.body.replyId
    );
    return res.json({ message: "success", message_id });
  }
);

// cid -> chatId
// ✅
router.delete("/deleteMessage/:mid/:cid", async (req, res) => {
  await chatController.deleteMessage(req.params.mid, req.params.cid);
  return res.json({ message: "success" });
});

// Auto-Reply
// uid -> userId, cid -> ChatId
// ✅
router.get("/getAutoReplies/:uid/:cid", async (req, res) => {
  return res.json(
    await chatController.getAutoReplies(req.params.uid, req.params.cid)
  );
});

// ✅
router.post("/addAutoReply/:uid/:cid", async (req, res) => {
  let autoReply = await chatController.addAutoReply(
    req.params.uid,
    req.params.cid,
    req.body
  );

  return res.json({ autoReply, message: "success" });
});

// ✅
router.put("/editAutoReply/:rid", async (req, res) => {
  let autoReply = await chatController.editAutoReply(
    req.params.rid,
    req.body.message,
    req.body.reply
  );

  return res.json({ autoReply, message: "success" });
});

// ✅
router.put("/removeAutoReply/:id", async (req, res) => {
  await chatController.removeAutoReply(req.params.id);
  return res.json({ message: "success" });
});

router.put("/modifyAutoReplies/", async (req, res) => {
  await chatController.modifyAutoReplies(req.body);
  return res.json({ message: "success" });
});

// Auto-Download
// ✅
router.put("/toggleAutoDownload/:sid", async (req, res) => {
  let value = await chatController.toggleAutoDownload(req.params.sid);
  return res.json({ message: "success", value });
});

// ✅
router.put("/updateDownloadDirectory/:sid", async (req, res) => {
  await chatController.updateDownloadDirectory(req.params.sid, req.body.dir);
  return res.json({ message: "success" });
});

// Message Scheduling
// router.post(
//   "/scheduleMessage",
//   messageAttchments.array("messageAttchments"),
//   async (req, res) => {
//     let { chats, messageContent, senderId, pushTime } = req.body;
//     console.log(req.body);

//     let id = await chatController.scheduleMessages(
//       chats,
//       messageContent,
//       req.files?.map((e) => `${destination}/${e.filename}`),
//       senderId,
//       pushTime
//     );

//     return res.json({ message: "success", id });
//   }
// );
router.post(
  "/scheduleMessage",
  messageAttchments.array("messageAttchments"),
  async (req, res) => {
    try {
      // Get all personalChats and groupChats from the request
      const personalChats = req.body.personalChats
        ? Array.isArray(req.body.personalChats)
          ? req.body.personalChats
          : [req.body.personalChats]
        : [];

      const groupChats = req.body.groupChats
        ? Array.isArray(req.body.groupChats)
          ? req.body.groupChats
          : [req.body.groupChats]
        : [];

      // Combine all chats
      const chats = [...personalChats, ...groupChats].filter((c) => c);

      console.log("Processing scheduled message with chats:", chats);

      let id = await chatController.scheduleMessages(
        chats, // Now passing combined array
        req.body.messageContent,
        req.files?.map((e) => `${destination}/${e.filename}`),
        req.body.senderId,
        req.body.pushTime
      );

      return res.json({ message: "success", id });
    } catch (error) {
      console.error("Error in scheduleMessage:", error);
      return res.status(500).json({ message: "error", error: error.message });
    }
  }
);
router.delete("/deleteScheduledMessage/:mid", async (req, res) => {
  await chatController.deleteScheduledMessage(req.params.mid);
  return res.json({ message: "success" });
});

router.get("/getChatParticipant/:cid/:uid", async (req, res) => {
  return res.json(
    await chatController.getChatParticipant(req.params.cid, req.params.uid)
  );
});

export default router;
