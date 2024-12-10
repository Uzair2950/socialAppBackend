import express from "express";
import studentController from "../controllers/studentController.js";

const router = express.Router();

router.get("/getTimetable/:sid", async (req, res) => {
  return res.json(await studentController.getTimeTable(req.params.sid));
});

router.get("/getDateSheet/:sid", async (req, res) => {
  return res.json(await studentController.getDateSheet(req.params.sid));
});

export default router;
