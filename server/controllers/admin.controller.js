import User from "../models/user.model.js";
import Interview from "../models/interview.model.js";
import Payment from "../models/payment.model.js";

// Helper middleware logic inside controller for simple authorization checking
const checkAdmin = async (userId) => {
    const user = await User.findById(userId);
    return user && user.role === 'admin';
};

export const getAdminStats = async (req, res) => {
    try {
        const isAdminUser = await checkAdmin(req.userId);
        if (!isAdminUser) {
            return res.status(403).json({ message: "Access denied. Admin privileges required." });
        }

        // Aggregate total metrics
        const totalUsers = await User.countDocuments();
        const totalInterviews = await Interview.countDocuments();
        const completedInterviews = await Interview.countDocuments({ isCompleted: true });

        // Aggregate top roles practiced
        const topRoles = await Interview.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Aggregate revenue from payments
        const revenueAggregation = await Payment.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;

        // Fetch all recent transactions
        const transactions = await Payment.find()
            .populate("userId", "name email")
            .sort({ createdAt: -1 })
            .limit(10);

        // Fetch all users list
        const users = await User.find({}, "name email credits role subscriptionPlan createdAt")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            stats: {
                totalUsers,
                totalInterviews,
                completedInterviews,
                totalRevenue,
                topRoles: topRoles.map(r => ({ role: r._id, count: r.count }))
            },
            transactions,
            users
        });

    } catch (error) {
        console.error("getAdminStats error:", error);
        return res.status(500).json({ message: `Failed to fetch admin stats: ${error.message}` });
    }
};

export const updateUserCredits = async (req, res) => {
    try {
        const isAdminUser = await checkAdmin(req.userId);
        if (!isAdminUser) {
            return res.status(403).json({ message: "Access denied. Admin privileges required." });
        }

        const { targetUserId, credits } = req.body;
        if (!targetUserId || credits === undefined) {
            return res.status(400).json({ message: "Missing targetUserId or credits amount" });
        }

        const user = await User.findById(targetUserId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.credits = Number(credits);
        await user.save();

        return res.status(200).json({ message: "Credits updated successfully", user });

    } catch (error) {
        console.error("updateUserCredits error:", error);
        return res.status(500).json({ message: `Failed to update user credits: ${error.message}` });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const isAdminUser = await checkAdmin(req.userId);
        if (!isAdminUser) {
            return res.status(403).json({ message: "Access denied. Admin privileges required." });
        }

        const { targetUserId, role } = req.body;
        if (!targetUserId || !role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: "Missing targetUserId or invalid role" });
        }

        const user = await User.findById(targetUserId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.role = role;
        await user.save();

        return res.status(200).json({ message: "User role updated successfully", user });

    } catch (error) {
        console.error("updateUserRole error:", error);
        return res.status(500).json({ message: `Failed to update user role: ${error.message}` });
    }
};
