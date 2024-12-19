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

router.get("/", messageAttchments.array("messages"), (req, res) => {
  console.log(req.files);
  let paths = res.send(paths);
});

router.post("/initiateChat/:sender/:receiver", async (req, res) => {
  await chatController.initiateChat(req.params.sender, req.params.receiver);
  return res.json({ message: "success" });
});

router.get("/getChat/:cid", async (req, res) => {
  return res.json(
    await chatController.getChat(
      req.params.cid,
      req.body.uid,
      req.body.messageCount
    )
  );
});

router.get("/getAllChats/:uid", async (req, res) => {
  return res.json(await chatController.getAllChats(req.params.uid));
});

router.get("/getMessage/:mid", async (req, res) => {
  return res.json(await chatController.getMessage(req.params.mid));
});

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

router.delete("/deleteMessage/:mid", async (req, res) => {
  await chatController.deleteMessage(req.params.mid);
  return res.json({ message: "success" });
});

export default router;
