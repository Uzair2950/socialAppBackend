import { model, Schema, Types } from "mongoose";

const _User = new Schema(
  {
    username: { type: String, required: true, index: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    avatarURL: { type: String, default: "" },
    bio: { type: String, default: "" },
    posts: [{ type: Types.ObjectId, ref: "post", default: [] }],
    friends: [{ type: Types.ObjectId, ref: "friend", default: [] }],
    activeChats: [{ type: Types.ObjectId, ref: "chat", default: [] }],
  },
  {
    virtuals: {
      id: {
        get() {
          return this._id;
        },
      },
    },
  }
);

const _Friends = new Schema({
  friend_id: { type: Types.ObjectId, ref: "user" },
  status: { type: String, enum: ["accepted", "pending"], default: "pending" },
});

const _Story = new Schema({
  author: { type: Types.ObjectId, ref: "user" },
  content: { type: String, default: "" },
  privacyLevel: { type: Number, enum: [0, 1, 2], default: 0 }, // 0 => Public, 1 => Friends Only 2 => Private
  attachements: [{ type: String, default: "" }],
  views: [{ type: Types.ObjectId, ref: "user" }],
});

const _Course = new Schema({
  code: { type: String, required: true },
  title: { type: String, required: true },
  creditHours: { type: Number, required: true },
});

const _Section = new Schema({
  title: { type: String, required: true },
});

const _Teacher = new Schema({
  user: { type: Types.ObjectId, ref: "user", required: true },
  allocated_courses: {
    type: [
      {
        section: _Section,
        courses: [{ type: Types.ObjectId, ref: "course" }],
      },
    ],
    default: [],
  },
});

const _Student = new Schema({
  cgpa: { type: Number, default: 0 },
  user: { type: Types.ObjectId, ref: "user", required: true },
  reg_no: { type: String, required: true },
  section: { type: Types.ObjectId, ref: "section", required: true },
  courses: [{ type: Types.ObjectId, ref: "course", default: [] }],
});

const _DataCellMember = new Schema({
  user: { type: Types.ObjectId, ref: "user", required: true },
})

const _Message = new Schema({
  senderId: { type: Types.ObjectId, ref: "user" },
  content: { type: String, default: "" },
  isReply: { type: Boolean, default: false },
  readBy: [{ type: Types.ObjectId, ref: "user" }],
  // ^ Why This? To Make Blue Ticks Easy!
  // just compare readBy Count with total chat participants :)))))
  reply: {
    repliedTo: { type: Types.ObjectId, ref: "message" },
  },
  attachements: [{ type: String, default: "" }],
  timestamp: { type: Date, default: Date.now },
});

const _Comment = new Schema({
  author: { type: Types.ObjectId, ref: "user" },
  content: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
});

const _Post = new Schema({
  author: { type: Types.ObjectId, ref: "user" },
  // Group Posts will be public by default.!
  privacyLevel: { type: Number, enum: [0, 1, 2], default: 0 }, // 0 => Public, 1 => Friends Only 2 => Private
  content: { type: String, default: "" },
  attachements: [{ type: String, default: "" }],
  likes: [{ type: Types.ObjectId, ref: "user", default: [] }],
  comments: [
    {
      type: {
        comment: { type: Types.ObjectId, ref: "comment" },
      },
      default: [],
    },
  ],
  timestamp: { type: Date, default: Date.now },
});

const _PostGroup = new Schema({
  title: { type: String, required: true },
  admins: [{ type: Types.ObjectId, ref: "user", default: [] }],
  posts: [
    {
      type: {
        author: { type: Types.ObjectId, ref: "user" },
        post: { type: Types.ObjectId, ref: "post" },
      },
      default: [],
    },
  ],
});

const _ChatGroup = new Schema({
  title: { type: String, required: true },
  chat: { type: Types.ObjectId, ref: "chat", required: true },
  privacyLevel: { type: Number, enum: [0, 1] }, //0 => Everyone can send , 1 => Only admins.
  admins: [{ type: Types.ObjectId, ref: "user", default: [] }],
});

// for personal
const _Chat = new Schema(
  {
    participants: [{ type: Types.ObjectId, ref: "user", default: [] }],
    messages: [{ type: Types.ObjectId, ref: "message", default: [] }],
  },
  {
    methods: {
      getTitle(current_user_id) {
        // Chat Head Title Is Different for every user.s
        return this.participants.filter(
          (y) => y._id.toString() != current_user_id
        )[0];
      },
      getChatHead(current_user_id) {
        let chatHead = {
          chatInfo: this.participants.filter(
            (y) => y._id.toString() != current_user_id
          )[0],
          lastMessage: this.messages[0] ?? {},
        };
        console.log(chatHead);
        return chatHead;
      },
    },
  }
);

const _GroupMembers = new Schema({
  // easier to lookup
  uid: { type: Types.ObjectId, required: true }, // ref => Users
  gid: { type: Types.ObjectId, required: true }, // ref => groups
});

const _CommunityMembers = new Schema({
  // easier to lookup
  uid: { type: Types.ObjectId, required: true }, // ref => Users
  cid: { type: Types.ObjectId, required: true }, // ref => Community
});

const _Community = new Schema({
  title: { type: String, required: true },
  admins: [{ type: Types.ObjectId, ref: "user", default: [] }],
  groups: [{ type: Types.ObjectId, ref: "postgroup" }],
  // Add announcement channel by default.
});

const _Notification = new Schema({
  user: { type: Types.ObjectId, ref: "user" },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ["message", "post", "friendRequest"],
    required: true,
  },
  isRead: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

const Users = model("user", _User);
const Friends = model("friend", _Friends);
const Courses = model("course", _Course);
const Sections = model("section", _Section);
const DataCellMembers = model("datacellmember", _DataCellMember);
const Teachers = model("teacher", _Teacher);
const Students = model("student", _Student);
const Messages = model("message", _Message);
const Comments = model("comment", _Comment);
const Posts = model("post", _Post);
const PostGroups = model("postgroup", _PostGroup);
const ChatGroups = model("chatgroup", _ChatGroup);
const Chats = model("chat", _Chat); // for personal
const GroupMembers = model("groupmembers", _GroupMembers);
const Communities = model("community", _Community);
const CommunityMembers = model("communitymembers", _CommunityMembers);
const Notifications = model("notification", _Notification);
const Stories = model("communitymembers", _Story);

export {
  Users,
  Friends,
  Courses,
  Sections,
  Teachers,
  Students,
  Messages,
  Comments,
  Posts,
  PostGroups,
  Chats,
  ChatGroups,
  GroupMembers,
  Communities,
  CommunityMembers,
  Notifications,
  Stories,
  DataCellMembers
};
