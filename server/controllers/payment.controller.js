import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";

// Initialize Razorpay conditionally
const getRazorpayInstance = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_id || !key_secret) {
        return null;
    }
    return new Razorpay({ key_id, key_secret });
};

export const createOrder = async (req, res) => {
    try {
        const { plan } = req.body;
        const userId = req.userId;

        if (!plan || !['starter', 'pro'].includes(plan)) {
            return res.status(400).json({ message: "Invalid plan selected" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let amount = plan === 'starter' ? 100 : 500; // in INR
        let creditGrant = plan === 'starter' ? 150 : 650;

        const razorpay = getRazorpayInstance();

        // FALLBACK: Simulated mode if keys are missing
        if (!razorpay) {
            console.log("Razorpay credentials missing. Running payment in MOCK mode.");
            
            // Instantly grant credits
            user.credits = (user.credits || 0) + creditGrant;
            user.subscriptionPlan = plan;
            await user.save();

            // Store mock transaction record
            const mockOrderId = `mock_order_${Date.now()}`;
            const mockPaymentId = `mock_pay_${Date.now()}`;
            await Payment.create({
                userId,
                amount,
                plan,
                razorpayOrderId: mockOrderId,
                razorpayPaymentId: mockPaymentId,
                status: 'success'
            });

            const userObj = user.toObject();
            delete userObj.password;

            return res.status(200).json({
                mock: true,
                message: `Mock payment successful! Granted ${creditGrant} credits.`,
                user: userObj
            });
        }

        // Real Razorpay Order Creation
        const options = {
            amount: amount * 100, // Razorpay works in paise
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        // Store transaction as pending
        await Payment.create({
            userId,
            amount,
            plan,
            razorpayOrderId: order.id,
            status: 'pending'
        });

        return res.status(201).json({
            mock: false,
            keyId: process.env.RAZORPAY_KEY_ID,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency
        });

    } catch (error) {
        console.error("createOrder error:", error);
        return res.status(500).json({ message: `Payment gateway error: ${error.message}` });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
        const userId = req.userId;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: "Missing signature fields for verification" });
        }

        const payment = await Payment.findOne({ razorpayOrderId });
        if (!payment) {
            return res.status(404).json({ message: "Order transaction details not found" });
        }

        const key_secret = process.env.RAZORPAY_KEY_SECRET;
        if (!key_secret) {
            return res.status(500).json({ message: "Payment verification failed. Key secret missing on server." });
        }

        // Generate signature verification
        const text = razorpayOrderId + "|" + razorpayPaymentId;
        const generatedSignature = crypto
            .createHmac("sha256", key_secret)
            .update(text)
            .digest("hex");

        if (generatedSignature !== razorpaySignature) {
            payment.status = 'failed';
            await payment.save();
            return res.status(400).json({ message: "Payment signature verification failed. Transaction rejected." });
        }

        // Mark transaction as successful
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.status = 'success';
        await payment.save();

        // Add credits to user
        const user = await User.findById(userId);
        let creditGrant = payment.plan === 'starter' ? 150 : 650;
        user.credits = (user.credits || 0) + creditGrant;
        user.subscriptionPlan = payment.plan;
        await user.save();

        const userObj = user.toObject();
        delete userObj.password;

        return res.status(200).json({
            message: "Payment verified successfully!",
            user: userObj
        });

    } catch (error) {
        console.error("verifyPayment error:", error);
        return res.status(500).json({ message: `Payment verification error: ${error.message}` });
    }
};
