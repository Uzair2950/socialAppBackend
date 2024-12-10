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
import postGroupRoute from "./routes/postGroupRoute.js"

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

////////////////////////////////////////////////////////////////////////

app.get("/", (req, res) => {
  res.send("Wow Apple!");
});

// Route Handler

app.use("/api/user", userRoutes);
app.use("/api/posts", postsRoute);
app.use("/api/student", studentsRoute);
app.use("/api/postgroup", postGroupRoute);

const startServer = async () => {
  let db = await connectDB();
  httpServer.listen(3001, () => {
    console.log("Listening On ws://localhost:3001\nhttp://localhost:3001");
  });
};

startServer();

// let users = await Users.find();
// console.log(users)
// let reg = "21-ARID-4591";
// users.forEach(async (element) => {
//   if (element.type == 0) {
//     await Students.insertMany([
//       {
//         user: element._id,
//         reg_no: reg,
//       },
//     ]);
//   } else if (element.type == 1) {
//     await Teachers.insertMany([{ user: element._id }]);
//   } else {
//     await Administrators.insertMany([{ user: element._id }]);
//   }
// });
