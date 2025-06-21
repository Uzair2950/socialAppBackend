import { CronJob } from "cron";
import { Chats, ScheduledMessages } from "./database/models/models.js";
import { io } from "socket.io-client";

let client = io("ws://localhost:3001");
client.connect();

const startMessageScheduler = () => {
  console.log("CRON JOB STARTED * * * * *");
  CronJob.from({
    cronTime: "* * * * *", // Every Minute
    // min hour day(month) month day(week)
    onTick: async () => {
      const date = new Date();
      let scheduledMessages = await ScheduledMessages.find({
        pushTime: { $lte: date },
      });

      if (scheduledMessages.length > 0) {
        console.log("==================================================");
        console.log("SCHEDULER AT WORK");
        console.log("==================================================");
        console.log(scheduledMessages);
      }

      let scheduledIds = scheduledMessages.map((e) => e._id);

      await ScheduledMessages.deleteMany({ _id: scheduledIds }); // Delete

      await Promise.all(
        scheduledMessages.map(async (scheduledMessage) => {
          let messageId = scheduledMessage.message;
          let senderId = scheduledMessage.sender;
          await Promise.all(
            scheduledMessage.chat.map(async (c) => {
              await Chats.findByIdAndUpdate(c, {
                $push: { messages: messageId },
              });
              // TODO: Create a new message for each scheduled message with same content obv
              console.log("EMITTING MESSAGE", {
                chatId: c,
                messageId,
                senderId,
              });
              client.emit("sendMessage", { chatId: c, messageId, senderId });
            })
          );
        })
      );
    },
  }).start();
};

export { startMessageScheduler };
