import { model, Schema, Types } from "mongoose";

const _User = new Schema({
  // username: { type: String, required: true, index: true },
  email: { type: String, required: true, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["student", "teacher", "administrator"],
    default: "student",
  },
  avatarURL: { type: String, default: "/static/avatars/default_avatar.png" },
  is_private: { type: Boolean, default: false },
  bio: { type: String, default: "" },
  activeChats: [{ type: Types.ObjectId, ref: "chat", default: [] }], // Personal Chats
  groupChats: [{ type: Types.ObjectId, ref: "chatgroup", default: [] }],
  uid: {
    type: Types.ObjectId,
    ref: function () {
      return this.type;
    },
  },
});

const _VipCollections = new Schema({
  creator: { type: Types.ObjectId, ref: "user" },
  people: [{ type: Types.ObjectId, ref: "user", default: [] }],
  messages: [{ type: Types.ObjectId, ref: "message", default: [] }],
});

const _ChatSettings = new Schema({
  uid: { type: Types.ObjectId, ref: "user" }, // Whose settings
  chat: { type: Types.ObjectId, ref: "chat" }, // Which Chat
  autoReply: { type: Boolean, default: false },
  autoDownload: { type: Boolean, default: false },
  autoDownloadDirectory: { type: String, default: "" },
});

const _Friends = new Schema(
  {
    uid: { type: Types.ObjectId, ref: "user" },
    friend_id: { type: Types.ObjectId, ref: "user" },
    status: { type: String, enum: ["accepted", "pending"], default: "pending" },
  },
  { timestamps: true }
);

const _Course = new Schema({
  _id: { type: String, required: true },
  title: String,
});


const _Section = new Schema({
  title: { type: String, required: true, unique: true },
  group: { type: Types.ObjectId, ref: "postgroup" },
});

const _Session = new Schema({
  year: { type: Number, required: true },
  name: { type: String, enum: ["Fall", "Spring", "Summer"], required: true },
  has_commenced: { type: Boolean, default: false },
});

const _Teacher = new Schema({
  department: { type: String, enum: ["CS", "AI", "SE"], default: "CS" },
});

const _Student = new Schema({
  reg_no: { type: String, required: true },
  department: { type: String, enum: ["CS", "AI", "SE"], default: "CS" },
  cgpa: { type: Number, default: 0 },
  section: { type: Types.ObjectId, ref: "section" },
});

const _Enrollment = new Schema({
  student: { type: Types.ObjectId, ref: "user" },
  course: { type: String, ref: "course" },
  section: { type: Types.ObjectId, ref: "section" },
  session: { type: Types.ObjectId, ref: "session" },
});

const _Allocation = new Schema({
  teacher: { type: Types.ObjectId, ref: "user" },
  course: { type: String, ref: "course" },
  section: [{ type: Types.ObjectId, ref: "section" }],
  session: { type: Types.ObjectId, ref: "session" },
});

const _Administrator = new Schema({
  // user: { type: Types.ObjectId, ref: "user", required: true },
  role: {
    type: String,
    enum: ["finance", "accounts", "datacell", "admission", "director", "admin"],
    default: "admin",
  },
});

const _Message = new Schema(
  {
    senderId: { type: Types.ObjectId, ref: "user" },
    content: { type: String, default: "" },
    isReply: { type: Boolean, default: false },
    readBy: [{ type: Types.ObjectId, ref: "user" }],
    readCount: { type: Number, default: 1 },
    // ^ Why This? To Make Blue Ticks Easy!
    // just compare readCount with total chat participants :)))))

    reply: {
      type: Types.ObjectId,
      ref: "message",
      default: null,
    },
    attachments: [{ type: String, default: [] }],
  },
  {
    timestamps: true,
  }
);

const _Comment = new Schema(
  {
    author: { type: Types.ObjectId, ref: "user" },
    content: { type: String, default: "" },
    likes: [{ type: Types.ObjectId, ref: "user", default: [] }],
    likesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const _Post = new Schema(
  {
    author: { type: Types.ObjectId, ref: "user", required: true },
    content: { type: String, default: "" },
    attachments: [{ type: String, default: "" }],
    type: { type: Number, default: 0 },
    // Group posts will be public by default.
    // self => <= 2
    // friend => <= 1
    // public => <= 0
    privacyLevel: { type: Number, enum: [0, 1, 2], default: 0 }, // 0 => Public, 1 => Friends Only 2 => Private
  },
  { timestamps: true }
);

const _PostInteraction = new Schema({
  post: { type: Types.ObjectId, ref: "post", required: true },
  poster: { type: Types.ObjectId, ref: "user", required: true },
  group_id: { type: Types.ObjectId, ref: "postgroup", default: null },
  is_pinned: { type: Boolean, default: false },
  allowCommenting: { type: Boolean, default: true },
  likes: [{ type: Types.ObjectId, ref: "user", default: [] }],
  comments: [{ type: Types.ObjectId, ref: "comment", default: [] }],
  expireAfter: { type: Date, default: null },
});

const _GroupRequests = new Schema(
  {
    gid: { type: Types.ObjectId, required: true }, // ref => groups
    user: { type: Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: true }
);

// Members in _GroupMembers
const _PostGroup = new Schema(
  {
    name: { type: String, required: true },
    admins: [{ type: Types.ObjectId, ref: "user", default: [] }],
    imgUrl: { type: String, default: "/static/avatars/default_group.png" },
    hasGroupChat: { type: Types.ObjectId, default: null },
    allowPosting: { type: Boolean, default: true },
    aboutGroup: { type: String, default: "" },
    is_private: { type: Boolean, default: false },
    totalMembers: { type: Number, default: 1 },
    isOfficial: { type: Boolean, default: false }, // Won't allow people to exit group!
    isSociety: { type: Boolean, default: false }, // to easily query socities
  },
  { timestamps: true }
);

const _ChatGroup = new Schema(
  {
    name: { type: String, required: true },
    chat: { type: Types.ObjectId, ref: "chat", required: true },
    allowChatting: { type: Boolean, default: true }, //0 => Everyone can send , 1 => Only admins.
    avatarURL: { type: String, default: "/static/avatars/default_group.png" },
    aboutGroup: { type: String, default: "" },
    admins: [{ type: Types.ObjectId, ref: "user", default: [] }],
  },
  { timestamps: true }
);

// for personal
const _Chat = new Schema(
  {
    isGroup: { type: Boolean, default: false },
    participants: [{ type: Types.ObjectId, ref: "user", default: [] }],
    totalParticipants: { type: Number, default: 1 },
    messages: [{ type: Types.ObjectId, ref: "message", default: [] }],
  },
  {
    timestamps: true,
  }
);

const _GroupMembers = new Schema({
  // easier to lookup
  uid: { type: Types.ObjectId, ref: "user", required: true }, // ref => Users
  gid: { type: Types.ObjectId, ref: "postgroup", required: true }, // ref => groups
});

const _CommunityMembers = new Schema({
  // easier to lookup
  uid: { type: Types.ObjectId, required: true, ref: "user" }, // ref => Users
  cid: { type: Types.ObjectId, required: true, ref: "community" }, // ref => Community
});

const _Community = new Schema({
  title: { type: String, required: true },
  communityAdmins: [{ type: Types.ObjectId, ref: "user", default: [] }],
  imgUrl: { type: String, default: "/static/avatars/default_community.png" },
  annoucementGroup: { type: Types.ObjectId, ref: "chatgroup" },
  aboutCommunity: { type: String, default: "" },
  // await community.populate('groups.gid', 'title imgUrl')
  groups: [
    {
      type: {
        group_type: {
          type: String,
          enum: ["postgroup", "chatgroup"],
          required: true,
        },
        gid: {
          type: Types.ObjectId,
          ref: function () {
            return this.group_type;
          },
        },
      },
      default: [],
    },
  ],
  // Add announcement channel by default.
});

const _Notification = new Schema(
  {
    user: { type: Types.ObjectId, ref: "user" },
    actor: { type: Types.ObjectId, ref: "user" },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "message",
        "post",
        "friendRequest",
        "welcome_community",
        "welcome_group",
        "general",
        "like",
        "comment",
      ],
      required: true,
      default: "general",
    },
    image1: { type: String, default: "" },
    image2: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);


const _TimeTable = new Schema({
  session: { type: Types.ObjectId, ref: "session" },
  section: { type: Types.ObjectId, ref: "section" },
  slots: {
    monday: {
      type: [
        {
          courseMap: { type: [String], default: [] },
          course: { type: String, ref: "course", required: true },
          venue: String,
          start_time: String,
          end_time: String,
          instructors: String,
        },
      ],
      default: [],
    },
    tuesday: {
      type: [
        {
          courseMap: { type: [String], default: [] },
          course: { type: String, ref: "course", required: true },
          venue: String,
          start_time: String,
          end_time: String,
          instructors: String,
        },
      ],
      default: [],
    },
    wednesday: {
      type: [
        {
          courseMap: { type: [String], default: [] },
          course: { type: String, ref: "course", required: true },
          venue: String,
          start_time: String,
          end_time: String,
          instructors: String,
        },
      ],
      default: [],
    },
    thursday: {
      type: [
        {
          courseMap: { type: [String], default: [] },
          course: { type: String, ref: "course", required: true },
          venue: String,
          start_time: String,
          end_time: String,
          instructors: String,
        },
      ],
      default: [],
    },
    friday: {
      type: [
        {
          courseMap: { type: [String], default: [] },
          course: { type: String, ref: "course", required: true },
          venue: String,
          start_time: String,
          end_time: String,
          instructors: String,
        },
      ],
      default: [],
    },
  },
});


// const _Slot = new Schema({
//   //  course: { type: Types.ObjectId, ref: "course", required: true },
//   course: { type: String, required: true }, //TODO: Add courseId instead of code..
//   instructors: { type: String, required: true },

//   venue: { type: String, required: true },
//   start_time: { type: String, required: true },
//   end_time: { type: String, required: true },
// });

const _DateSheet = new Schema({
  session: { type: Types.ObjectId, ref: "session" },
  type: { type: String, enum: ["Mid", "Final"], default: "Mid" },
  course_id: { type: String, ref: "course" },
  day: String,
  time: String,
  commenced: { type: Boolean, default: false },
});

const _AutoReply = new Schema({
  user: { type: Types.ObjectId, ref: "user" },
  chat: { type: Types.ObjectId, ref: "chat" },
  message: { type: String, required: true },
  reply: { type: String, required: true },
});

const _ScheduledMessages = new Schema({
  // Same Message for multiple chats... can be a group or personal chat doesn't matter
  chat: [{ type: Types.ObjectId, ref: "chat" }],
  message: { type: Types.ObjectId, ref: "message" },
  pushTime: { type: Date },
  sender: { type: Types.ObjectId, ref: "user" },
});

const Users = model("user", _User);
const ChatSettings = model("chatsettings", _ChatSettings);
const Friends = model("friend", _Friends);
const Courses = model("course", _Course);

const Sections = model("section", _Section);
const Administrators = model("administrator", _Administrator);
const VipCollections = model("vipcollection", _VipCollections);
const Teachers = model("teacher", _Teacher);
const Students = model("student", _Student);
const Enrollment = model("enrollment", _Enrollment);
const Allocation = model("allocation", _Allocation);
const Messages = model("message", _Message);
const Comments = model("comment", _Comment);
const Posts = model("post", _Post);
const PostInteraction = model("postinteraction", _PostInteraction);
const PostGroups = model("postgroup", _PostGroup);
const ChatGroups = model("chatgroup", _ChatGroup);
const Chats = model("chat", _Chat); // for personal
const GroupMembers = model("groupmembers", _GroupMembers);
const GroupRequests = model("grouprequest", _GroupRequests);
const Communities = model("community", _Community);
const CommunityMembers = model("communitymembers", _CommunityMembers);
const Notifications = model("notification", _Notification);

const Sessions = model("session", _Session);
// const Slots = model("slots", _Slot);
const TimeTable = model("timetable", _TimeTable);
const Datesheet = model("datesheet", _DateSheet);
const AutoReply = model("autoreply", _AutoReply);
const ScheduledMessages = model("scheduledmessage", _ScheduledMessages);
const CourseMap = model("coursemap", new Schema({
  courses: [{ type: String, ref: "course", required: true }]
}))

export {
  Users,
  ChatSettings,
  VipCollections,
  Friends,
  Courses,
  CourseMap,
  Sections,
  Teachers,
  Students,
  Messages,
  Comments,
  Posts,
  PostInteraction,
  PostGroups,
  Chats,
  ChatGroups,
  GroupMembers,
  Communities,
  CommunityMembers,
  Notifications,
  // Slots,
  Administrators,
  Sessions,
  TimeTable,
  Datesheet,
  AutoReply,
  Enrollment,
  Allocation,
  GroupRequests,
  ScheduledMessages,
};
