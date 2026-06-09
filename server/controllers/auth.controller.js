import genToken from "../config/token.js"; 
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const register = async (req, res) => {
    try {
        const { name, email, password, gender } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill out all fields" });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await User.create({
            name,
            email,
            password: hashedPassword,
            credits: 100,
            role: "user",
            subscriptionPlan: "free",
            gender: gender || "male"
        });

        const token = await genToken(user._id);
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to true in production
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Strip password before returning
        const userObj = user.toObject();
        delete userObj.password;

        return res.status(201).json(userObj);
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ message: `Registration error: ${error.message}` });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Please enter email and password" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        if (!user.password) {
            return res.status(400).json({ message: "This email is registered via Google Auth. Please use Google Login." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = await genToken(user._id);
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to true in production
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const userObj = user.toObject();
        delete userObj.password;

        return res.status(200).json(userObj);
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: `Login error: ${error.message}` });
    }
};

export const googleAuth = async (req, res) => {
    try {
        const { name, email, gender } = req.body;
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({ 
                name, 
                email,
                credits: 100,
                role: "user",
                subscriptionPlan: "free",
                gender: gender || "male"
            });
        }
        let token = await genToken(user._id);
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        const userObj = user.toObject();
        delete userObj.password;

        return res.status(200).json(userObj);
    } catch (error) {
        console.error("Google auth error:", error);
        return res.status(500).json({ message: `Google auth error: ${error.message}` });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Please provide your email address" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        // Return successful message simulating email link send
        return res.status(200).json({ message: "Reset password link successfully simulated. Verify your inbox!" });
    } catch (error) {
        return res.status(500).json({ message: `Forgot password error: ${error.message}` });
    }
};

export const logout = async (req, res) => {
    try {
        await res.clearCookie('token');
        return res.status(200).json({ message: 'logout success' });
    } catch (error) {
        return res.status(500).json({ message: `logout error ${error}` });
    }
};
