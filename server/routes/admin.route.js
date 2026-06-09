import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { getAdminStats, updateUserCredits, updateUserRole } from "../controllers/admin.controller.js";

const adminRouter = express.Router();

adminRouter.get("/stats", isAuth, getAdminStats);
adminRouter.post("/update-credits", isAuth, updateUserCredits);
adminRouter.post("/update-role", isAuth, updateUserRole);

export default adminRouter;
