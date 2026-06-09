import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
    createInterview,
    submitInterview,
    getInterviews,
    getInterviewById
} from "../controllers/interview.controller.js";

const interviewRouter = express.Router();

interviewRouter.post("/create", isAuth, createInterview);
interviewRouter.post("/submit", isAuth, submitInterview);
interviewRouter.get("/history", isAuth, getInterviews);
interviewRouter.get("/:id", isAuth, getInterviewById);

export default interviewRouter;
