import path from "path";
import express from "express";
import postController from "../controllers/postController.js";
import multer from "multer";
import { validateRequest } from "zod-express-middleware";
import { z } from "zod";

const storage = multer.diskStorage({
  destination: "./static/posts",
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}_${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const postsAttachments = multer({ storage });
const router = express.Router();

router.get("/", (req, res) => res.json({ message: "OK" }));

router.post(
  "/addPost",
  postsAttachments.array("postsImages"),
  async (req, res) => {
    let attachements = req.files.map((e) => e.path);
    let { author, type, content, privacyLevel } = req.body;
    await postController.addPost(
      author,
      type,
      privacyLevel,
      content,
      attachements
    );
    return res.json({ message: "Posted!" });
  }
);

router.get("/getPosts/:uid", async (req, res) => {
  res.json(await postController.getPosts(req.params.uid, 0));
});

router.post("/likePost/:pid/:uid", async (req, res) => {
  await postController.likePost(req.params.pid, req.params.uid);
  return res.json({ message: "Liked!" });
});

router.post(
  "/addComment/:pid",
  validateRequest({
    body: z.object({
      author: z.string(),
      content: z.string(),
    }),
  }),
  async (req, res) => {
    await postController.addComment(
      req.params.pid,
      req.body.author,
      req.body.content
    );
    return res.json({ message: "Comment Added" });
  }
);

export default router;

//Routes
