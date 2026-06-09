import express from 'express';
import dotenv from 'dotenv';
import connectDb from './config/connectDb.js';
dotenv.config();
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.route.js';
import userRouter from './routes/user.route.js';
import interviewRouter from './routes/interview.route.js';
import resumeRouter from './routes/resume.route.js';
import paymentRouter from './routes/payment.route.js';
import adminRouter from './routes/admin.route.js';

const app = express();
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/interviews", interviewRouter);
app.use("/api/resumes", resumeRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/admin", adminRouter);

// Standardize PORT environment key support
const port = process.env.PORT || process.env.port || 8000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    connectDb();
});
