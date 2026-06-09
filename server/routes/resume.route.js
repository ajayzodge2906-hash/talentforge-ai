import express from "express";
import multer from "multer";
import isAuth from "../middlewares/isAuth.js";
import { uploadResume, getResume, getResumeHistory, getResumeById, deleteResume } from "../controllers/resume.controller.js";

const resumeRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

resumeRouter.post("/upload", isAuth, upload.single("file"), uploadResume);
resumeRouter.get("/history", isAuth, getResumeHistory);
resumeRouter.get("/:id", isAuth, getResumeById);
resumeRouter.delete("/:id", isAuth, deleteResume);
resumeRouter.get("/", isAuth, getResume);

export default resumeRouter;
