import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: false // Optional for Google Login
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    credits: {
        type: Number,
        default: 100
    },
    subscriptionPlan: {
        type: String,
        enum: ['free', 'starter', 'pro'],
        default: 'free'
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        default: 'male'
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;
