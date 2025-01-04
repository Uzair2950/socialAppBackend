import cors from "cors";
import express from "express";
import pkg from "body-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import morgan from "morgan";
import { connectDB } from "./database/db.js";

// Routes
import userRoutes from "./routes/userRoutes.js";
import postsRoute from "./routes/postsRoute.js";
import studentsRoute from "./routes/studentRoute.js";
import postGroupRoute from "./routes/postGroupRoute.js";
import chatGroupRoute from "./routes/chatGroupRoute.js";
import communityRoute from "./routes/communityRoute.js";
import chatRoute from "./routes/chatRoute.js";
import feedRouter from "./routes/feedRoute.js";
import { getAutoReply, isGroupChat } from "./utils/utils.js";

////////////////////////////////////////////////////////////////////////

const app = express();

// Middleware
app.use(pkg.json());

app.use(
  pkg.urlencoded({
    extended: true,
  })
);

app.use(cors());
app.use(morgan("tiny"));

app.use("/static", express.static("static"));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

// io.on("connection", (socket) => {
//   console.log("CONNECTED");

//   socket.on("sendMessage", ({ chatId, messageId }) => {
//     console.log({ chatId, messageId });
//     io.emit(`receiveMessage_${chatId}`, messageId);

//     console.log("EMITTING: updateAllChatsView", chatId, messageId);
//     io.emit(`updateAllChatsView`, chatId, messageId);
//   });

//   socket.on("disconnect", async (s) => {
//     console.log("DISCONNECTED");
//   });
// });

// After auto-reply
io.on("connection", (socket) => {
  console.log("CONNECTED");

  socket.on("sendMessage", async ({ chatId, messageId, senderId }) => {
    console.log({ chatId, messageId });



    io.emit(`receiveMessage_${chatId}`, messageId); // Emit the current message
    console.log("EMITTING: updateAllChatsView", chatId, messageId);
    io.emit(`updateAllChatsView`, chatId, messageId);

    // Find the auto reply message
    if (!isGroupChat(chatId)) {
      console.log("Not Group Chat")
      let autoReplyId = await getAutoReply(chatId, senderId, messageId);
      if (autoReplyId) {
        console.log("Auto Reply Found")
        io.emit(`receiveMessage_${chatId}`, autoReplyId); // Emit the autoReply message
        io.emit(`updateAllChatsView`, chatId, autoReplyId); // Update all chats view
      }
    } 

    // TODO: Implement VIP messages filtering
  });

  socket.on("disconnect", async (s) => {
    console.log("DISCONNECTED");
  });
});

////////////////////////////////////////////////////////////////////////

app.get("/", (req, res) => {
  res.send("Wow Apple!");
});

// Route Handler

app.use("/api/user", userRoutes);
app.use("/api/posts", postsRoute);
app.use("/api/student", studentsRoute);
app.use("/api/postgroup", postGroupRoute);
app.use("/api/chatgroup", chatGroupRoute);
app.use("/api/community", communityRoute);
app.use("/api/chat", chatRoute);
app.use("/api/feed", feedRouter);

(async () => {
  await connectDB();
  httpServer.listen(3001, () => {
    console.log("Listening On ws://localhost:3001\nhttp://localhost:3001");
  });
})();

// startServer();
