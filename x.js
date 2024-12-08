import { connectDB } from "./database/db.js";
// import { Friends } from "./database/models/models.js";

// let db = await connectDB();
// // let uid = "6754a9268db89992d5b8221e";
// // let friends = await Friends.find({ status: "accepted", uid })
// //   .populate("friend_id", "name avatarURL")
// //   .select("friend_id");
// // // 2. Get Friends who added this user.
// // let friends2 = await Friends.find({ status: "accepted", friend_id: uid })
// //   .populate("uid", "name avatarURL")
// //   .select("uid");

// // // console.log(friends)
// // // console.log("+=====================================================================================+")
// // // console.log(friends2)

// // console.log([...friends, ...friends2]);

// const isFriend = async (uid, fid) => {
//   let res = await Friends.findOne({
//     $or: [
//       { uid: uid, friend_id: fid },
//       { uid: fid, friend_id: uid },
//     ],
//     status: "accepted",
//   });

//   return res ? true : false;
// };

// console.log(await isFriend("6754a9268db89992d5b8221f", "6754a9268db89992d5b82222"));

// db.disconnect();

import userController from "./controllers/userController.js";

let db = await connectDB()


console.log(await userController.getFriends('6754a9268db89992d5b8221e', true, 2))

db.disconnect()



