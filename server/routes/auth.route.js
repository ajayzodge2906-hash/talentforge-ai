import express from "express";
import { register, login, googleAuth, forgotPassword, logout } from "../controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/google", googleAuth);
authRouter.post("/forgot-password", forgotPassword);
authRouter.get("/logout", logout);

export default authRouter;
