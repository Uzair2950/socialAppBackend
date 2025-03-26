import { model, Types, Schema } from "mongoose";
import { writeFile } from "fs";
import { connectDB } from "./database/db.js";
import pkg from "xlsx";
const { readFile, utils } = pkg;
import { difference, intersection, union } from "set-operations";
import {

  ChatGroups,
  Chats,
  Communities,
  CommunityMembers,
  Courses,
  Enrollment,
  GroupMembers,
  PostGroups,
  PostInteraction,
  Posts,
  Users,
} from "./database/models/models.js";
import { getCoursesMapping, getCurrentSessionId } from "./utils/utils.js";

let myId = "6754a9268db89992d5b8221e";
let bitId = "6797ebcc37200dbcdec36ba9";
let db = await connectDB();


let file = readFile("datesheet.xls"); // TODO: Add the dot.
let session = await getCurrentSessionId();
let sheetNames = file.SheetNames;
const codeRegex = /\b[A-Z]{2,3}-?\d{3}\b/;
let dateSheet = {};
for (let i = 0; i < sheetNames.length; i++) {
  let currSheet = sheetNames[i];
  let x = utils.sheet_to_json(file.Sheets[currSheet], { header: "A" });
  writeFile(currSheet + ".json", JSON.stringify(x, null, 2), (err) => { })
  // let examType = x[1]["A"].trim().split(" ")[0];
  // let time = x[2]["A"].trim();

  // // Datehseet starts from index 5

  // for (let j = 5; j < x.length; j++) {
  //   let data = x[j];
  //   let day = data["A"];
  //   let date = data["B"];

  //   let keys = Object.keys(data).filter((i) => i != "A" && i != "B");

  //   await Promise.all(
  //     keys.map(async (key) => {
  //       const codeMatch = data[key].match(codeRegex);
  //       if (codeMatch) {
  //         let code = codeMatch[0].trim().split("-").join("");
  //         console.log("Code = " + code);
  //         // // dateSheet.push();
  //         // if (!Object.keys(dateSheet).includes(code)) {
  //         //   console.log(code + " Is not in")
  //         //   dateSheet = {
  //         //     ...dateSheet, [code]: {
  //         //       session,
  //         //       type: examType.toLowerCase(),
  //         //       course_id: await getCoursesMapping(code),
  //         //       day: day,
  //         //       date: date,
  //         //     }
  //         //   }
  //         // } else {
  //         //   console.log(code + " Is already in ");
  //         // }
  //       }
  //     })
  //   );

  // }

}
// let cc = dateSheet.map(e => e.course_id)
// // console.log(cc)
// // console.log(dateSheet)
// await Promise.all(cc.map(async e => {
//   let cc = await Courses.findOne({ _id: e });
//   // console.log(cc)
//   if (cc == null) console.log(`NOT FOUND ${e}`)
//   console.log(`${e} = ${cc}`)
// }))




async function getCommunity(cid, requesterId) {
  let community = await Communities.findById(cid).select("-__v");
  let isMember = await CommunityMembers.findOne({ cid, uid: requesterId });


  if (!isMember) {
    return {
      title: community.title,
      imgUrl: community.imgUrl,
      totalGroups: community.postgroup.length + community.chatgroup.length,
      isMember: false,
    };
  }

  let usersChatsGroups = (await Users.findById(requesterId).select("-_id groupChats communityGroups"))
  usersChatsGroups = [...usersChatsGroups.communityGroups.map(String), ...usersChatsGroups.groupChats.map(String)]

  let userPostGroups = (await GroupMembers.find({ uid: requesterId }).select("-_id gid")).map(e => e.gid.toString())


  let communityGroupChats = community.chatgroup.map(String)
  let communityPostGroups = community.postgroup.map(String)

  let excludedChatGroupIds = difference(communityGroupChats, usersChatsGroups).splice(0, 3) // User exists in these chats
  let excludedPostGroupIds = difference(communityPostGroups, userPostGroups).splice(0, 3)

  let joinedGroupChatsIds = intersection(communityGroupChats, usersChatsGroups).splice(0, 3)
  let joinedPostGroupIds = intersection(communityPostGroups, userPostGroups).splice(0, 3)


  let [excludedChatGroup, joinedGroupChats] = await Promise.all([
    selectGroupChats(excludedChatGroupIds, "name imgUrl chat"),
    selectGroupChats(joinedGroupChatsIds, "name imgUrl chat")
  ])

  let [excludedPostGroup, joinedPostGroup] = await Promise.all([
    selectPostGroups(excludedPostGroupIds, "name imgUrl"),
    selectPostGroups(joinedPostGroupIds, "name imgUrl")
  ])

  let excludedGroups = getRandomThree([...excludedChatGroup, ...excludedPostGroup])
  let includedGroups = getRandomThree([...joinedGroupChats, ...joinedPostGroup])

  let isAdmin = community.communityAdmins.includes(requesterId);
  let isCreator = community.communityAdmins[0] == requesterId;

  let comms = (await Communities.aggregate([
    { $match: { _id: new Types.ObjectId(cid) } },
    {
      $lookup: {
        from: "chatgroups",
        localField: "annoucementGroup",
        foreignField: "_id",
        as: "annoucementGroup",
        pipeline: [
          {
            $lookup: {
              from: "chats",
              localField: "chat",
              foreignField: "_id",
              as: "chatData"
            }
          },
          { $unwind: { path: "$chatData", preserveNullAndEmptyArrays: true } },
          {
            $set: {
              lastMessage: { $last: "$chatData.messages" }
            }
          },
          {
            $lookup: {
              from: "messages",
              localField: "lastMessage",
              foreignField: "_id",
              as: "lastMessage"
            },
          },
          { $unwind: "$lastMessage" },
          {
            $lookup: {
              from: "users",
              localField: "lastMessage.senderId",
              foreignField: "_id",
              as: "lastMessage.senderId"
            },
          },
          { $unwind: "$lastMessage.senderId" },
          {
            $project: {
              _id: 0,
              "chat": 1,
              "lastMessage.senderId": "$lastMessage.senderId._id",
              "lastMessage.senderName": "$lastMessage.senderId.name",
              "lastMessage.content": 1,
              "lastMessage.attachments": 1,
              "lastMessage.createdAt": 1,
            }
          },
        ]
      },
    },
    { $unwind: { path: "$annoucementGroup", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        title: 1,
        imgUrl: 1,
        aboutCommunity: 1,
        "annoucementGroup": "$annoucementGroup.chat",
        lastMessage: "$annoucementGroup.lastMessage", // Move lastMessage to root,
      }
    }
  ]))[0];

  let memberCount = await CommunityMembers.countDocuments({ cid })


  return { ...comms, memberCount, excludedGroups, includedGroups, isAdmin, isCreator, isMember: true };
}

console.log(JSON.stringify(await getCommunity("67dc761125f6b25740564bec", myId), null, 2))



await db.disconnect();
