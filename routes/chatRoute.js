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
  return res.send({message: "Test"})
});

router.post("/initiateChat/:sender/:receiver", async (req, res) => {
  await chatController.initiateChat(req.params.sender, req.params.receiver);
  return res.json({ message: "success" });
});

router.get("/getChat/:cid/:uid/:messageCount", async (req, res) => {
  return res.json(
    await chatController.getChat(
      req.params.cid,
      req.params.uid,
      parseInt(req.params.messageCount)
    )
  );
});

router.get("/getAllChats/:uid", async (req, res) => {
  return res.json(await chatController.getAllChats(req.params.uid));
});

router.get("/getMessage/:mid/:uid", async (req, res) => {
  return res.json(await chatController.getMessage(req.params.mid, req.params.uid));
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
