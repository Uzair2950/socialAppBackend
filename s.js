import { CronJob } from "cron";

let job = CronJob.from({
    cronTime: "* * * * *", // Every Minute
    onTick: () => {
        console.log("console.log('You will see this message every second');")
    }
})


job.start()