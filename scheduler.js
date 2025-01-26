import { CronJob } from "cron";
import { Chats, ScheduledMessages } from "./database/models/models.js";
import { io } from "socket.io-client";

let client = io("ws://localhost:3001");
client.connect();

const startMessageScheduler = () => {
  console.log("STARTED");
  CronJob.from({
    cronTime: "* * * * *", // Every Minute
    // min hour day(month) month day(week)
    onTick: async () => {
      const date = new Date();
      let scheduledMessages = await ScheduledMessages.find({
        pushTime: { $lt: date },
      });
      //   console.log(scheduledMessages);
      //   console.log("TICKED");
      // let scheduledIds = scheduledMessages.map((e) => e._id);

      // await ScheduledMessages.deleteMany({ _id: scheduledIds });

      await Promise.all(
        scheduledMessages.map(async (scheduledMessage) => {
          let messageId = scheduledMessage.message;
          let senderId = scheduledMessage.sender;
          await Promise.all(
            scheduledMessage.chat.map(async (c) => {
              await Chats.findByIdAndUpdate(c, {
                $push: { messages: messageId },
              });
              // console.log("sendMessage", { chatId: c, messageId, senderId });
              client.emit("sendMessage", { chatId: c, messageId, senderId });
            })
          );
        })
      );

      // io.emit("cronEvent", { message: "Wow" });
    },
  }).start();
};

export { startMessageScheduler };
