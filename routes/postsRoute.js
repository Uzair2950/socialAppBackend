import path from "path";
import express from "express";
import postController from "../controllers/postController.js";
import multer from "multer";
import { validateRequest } from "zod-express-middleware";
import { z } from "zod";

const destination = "/static/posts";
 
const storage = multer.diskStorage({
  destination: `.${destination}`,
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

router.post("/", postsAttachments.array("images"), (req, res) => {
  console.log(req.files);
  console.log(req.body);
  return res.json({ message: "OK" });
});

// ✅
// group_id = 
router.post(
  "/addPost",
  postsAttachments.array("attachments"),
  async (req, res) => {
    let attachements = req.files?.map((e) => `${destination}/${e.filename}`);
    console.log(req.body)
    let { author, content, privacyLevel, group_ids, type, allowCommenting, postOnTimeline } =
      req.body;

    let prv_level = parseInt(privacyLevel);
    let post_id = await postController.addPost(
      author,
      prv_level == NaN ? 0 : prv_level,
      content,
      attachements,
      group_ids,
      parseInt(type),
      allowCommenting,
      postOnTimeline
    );
    if (post_id) {
      return res.json({ message: "Posted!", post_id });
    }
    return res.status(400).json({ message: "Invalid timetable format!" });
  }
);

// router.put(
//   "/editPost/:pid",
//   postsAttachments.array("postsImages"),
//   async (req, res) => {
//     // attachments inside body will contain the attachments that are already in post.
//     // the removed attachment won't be included in the attachments list (from frontend)
//     let newAttachments = req.files?.map((e) => `${destination}/${e.filename}`);
//     await postController.editPost(req.params.pid, {
//       attachments: [...req.body.attachments, ...newAttachments],
//       content: req.body.content,
//     });
//     return res.json({ message: "success" });
//   }
// );

// ✅
router.get("/getPosts/:uid", async (req, res) => {
  res.json(await postController.getPosts(req.params.uid, 0));
});

// // ✅
// router.post("/likePost/:pid/:uid", async (req, res) => {
//   await postController.likePost(req.params.pid, req.params.uid);
//   return res.json({ message: "Liked!" });
// });

// // ✅
// router.post("/unlikePost/:pid/:uid", async (req, res) => {
//   await postController.unlikePost(req.params.pid, req.params.uid);
//   return res.json({ message: "Liked!" });
// });

/*
  @piid => PostInteractionId
  @uid => UserId (Id of user who is liking or disliking the post)
  @state => Either true or false (true if disliking else false)

*/
router.put("/togglePostLike/:piid/:uid/:state", async (req, res) => {
  let { piid, uid, state } = req.params;
  return res.json({
    currentState: await postController.togglePostLike(piid, uid, state),
  });
});

// ✅
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

// ✅
router.put("/toggleCommenting/:pId", async (req, res) => {
  await postController.toggleCommenting(req.params.pId);
  return res.json({ message: "success" });
});

// ✅
// Like / Unlike Comment
router.put("/toggleCommentInteraction/:cid/:uid/:state", async (req, res) => {
  await postController.toggleCommentInteraction(
    req.params.cid,
    req.params.uid,
    req.params.state
  );
  return res.json({ message: "success" });
});

// ✅
router.get("/getComments/:pid/:uid", async (req, res) => {
  return res.json(
    await postController.getComments(req.params.pid, req.params.uid)
  );
});

// ✅
router.put("/changeVisbility/:pId/:vis", async (req, res) => {
  await postController.changeVisibility(req.params.pId, req.params.vis);
  return res.json({ message: "success" });
});

// // ✅
// router.post("/pinPost/:pId", async (req, res) => {
//   await postController.pinPost(req.params.pId);
//   return res.json({ message: "Post Pinned" });
// });

// // ✅
// router.post("/unpinPost/:pId", async (req, res) => {
//   await postController.unpinPost(req.params.pId);
//   return res.json({ message: "Post Un-Pinned" });
// });

router.post("/togglePostPin", async (req, res) => {
  let { pid, uid, group_id, expiryTime, currentState } = req.body;
  return res.json(
    await postController.togglePostPin(
      pid,
      uid,
      group_id,
      expiryTime,
      currentState
    )
  );
});

// Delete Post
router.delete("/deletePost/:pId", async (req, res) => {
  await postController.deletePost(req.params.pId);
  return res.json({ message: "Post Deleted" });
});

export default router;

//Routes
