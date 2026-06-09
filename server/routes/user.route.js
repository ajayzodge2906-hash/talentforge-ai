import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { getCurrentUser, addCredits } from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.get("/current-user", isAuth, getCurrentUser);
userRouter.post("/add-credits", isAuth, addCredits);

export default userRouter;
