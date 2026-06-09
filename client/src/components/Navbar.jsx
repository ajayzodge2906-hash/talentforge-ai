import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from "motion/react"
import { BsRobot, BsCoin, BsShieldLock } from "react-icons/bs"
import { HiOutlineLogout } from "react-icons/hi"
import { FaUserAstronaut, FaHome, FaFileAlt, FaChartBar } from "react-icons/fa";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ServerUrl } from '../App';
import { setUserData } from '../redux/userSlice';

function Navbar() {
    const { userData } = useSelector((state) => state.user);
    const [showCreditPopup, setShowCreditPopup] = useState(false);
    const [showUserPopup, setShowUserPopup] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogout = async () => {
        try {
            await axios.get(ServerUrl + "/api/auth/logout", { withCredentials: true });
            dispatch(setUserData(null));
            navigate('/auth');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <div className="bg-[#0b0f19] flex justify-center px-4 pt-6 select-none">
            <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-6xl bg-gray-900/60 rounded-3xl shadow-lg border border-gray-800/80 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center relative z-50 backdrop-blur-md"
            >
                {/* Logo Section */}
                <Link to="/dashboard" className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition">
                    <div className="bg-gradient-to-tr from-emerald-500 to-blue-500 text-white w-8 h-8 rounded-xl shadow-md shadow-emerald-500/10 flex items-center justify-center font-extrabold text-xs tracking-tight">
                        AZ
                    </div>
                    <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent hidden sm:inline-block">TalentForge.AI</span>
                </Link>

                {/* Right Actions Section */}
                <div className="flex items-center gap-4 relative">
                    {userData ? (
                        <>
                            {/* Credits Chip */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowCreditPopup(!showCreditPopup);
                                        setShowUserPopup(false);
                                    }}
                                    className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-4 py-2 rounded-full text-sm font-semibold text-emerald-450 hover:text-emerald-400 transition cursor-pointer text-emerald-450"
                                >
                                    <BsCoin size={15} className="text-emerald-400 animate-pulse" />
                                    <span>{userData.credits}<span className="hidden sm:inline"> credits</span></span>
                                </button>

                                <AnimatePresence>
                                    {showCreditPopup && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-3 w-64 bg-gray-900 shadow-xl border border-gray-800 rounded-2xl p-5 z-50"
                                        >
                                            <h4 className="font-bold text-sm text-gray-100 mb-1">Practice & Improve</h4>
                                            <p className="text-xs text-gray-450 mb-4 leading-relaxed">
                                                Each AI mock session consumes 10 credits. Manage bundles on the billing portal.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setShowCreditPopup(false);
                                                    navigate('/pricing');
                                                }}
                                                className="w-full bg-gray-950/60 hover:bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs backdrop-blur-md"
                                            >
                                                Buy More Credits
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* User Menu Avatar */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowUserPopup(!showUserPopup);
                                        setShowCreditPopup(false);
                                    }}
                                    className="w-9 h-9 bg-gradient-to-tr from-emerald-500 to-blue-500 hover:opacity-90 text-white rounded-full flex items-center justify-center font-bold text-sm transition cursor-pointer shadow-md shadow-emerald-500/10"
                                >
                                    {userData.name ? userData.name.slice(0, 1).toUpperCase() : <FaUserAstronaut size={14} />}
                                </button>

                                <AnimatePresence>
                                    {showUserPopup && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-3 w-56 bg-gray-900 shadow-xl border border-gray-800 rounded-2xl p-2 z-50 overflow-hidden"
                                        >
                                            <div className="px-4 py-3 border-b border-gray-800">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] bg-blue-550/20 text-blue-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-blue-500/20">
                                                        {userData.role}
                                                    </span>
                                                    {userData.subscriptionPlan !== 'free' && (
                                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-emerald-500/20">
                                                            {userData.subscriptionPlan}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-gray-100 truncate mt-1.5">{userData.name}</p>
                                                <p className="text-xs text-gray-400 truncate">{userData.email}</p>
                                            </div>

                                            <div className="p-1">
                                                <button
                                                    onClick={() => {
                                                        setShowUserPopup(false);
                                                        navigate('/dashboard');
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 rounded-xl transition cursor-pointer"
                                                >
                                                    <FaHome size={14} className="text-gray-400" />
                                                    <span>Dashboard</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowUserPopup(false);
                                                        navigate('/resume');
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 rounded-xl transition cursor-pointer"
                                                >
                                                    <FaFileAlt size={14} className="text-gray-400" />
                                                    <span>Resume Analyzer</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowUserPopup(false);
                                                        navigate('/analytics');
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 rounded-xl transition cursor-pointer"
                                                >
                                                    <FaChartBar size={14} className="text-gray-400" />
                                                    <span>Analytics Board</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowUserPopup(false);
                                                        navigate('/pricing');
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 rounded-xl transition cursor-pointer"
                                                >
                                                    <BsCoin size={14} className="text-gray-400" />
                                                    <span>Billing Plans</span>
                                                </button>
                                                {userData.role === 'admin' && (
                                                    <>
                                                        <hr className="my-1 border-gray-800" />
                                                        <button
                                                            onClick={() => {
                                                                setShowUserPopup(false);
                                                                navigate('/admin');
                                                            }}
                                                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition cursor-pointer font-semibold"
                                                        >
                                                            <BsShieldLock size={15} />
                                                            <span>Admin Console</span>
                                                        </button>
                                                    </>
                                                )}
                                                <hr className="my-1 border-gray-800" />
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                                                >
                                                    <HiOutlineLogout size={16} />
                                                    <span>Logout</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={() => navigate('/auth')}
                            className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:opacity-95 text-white px-5 py-2 rounded-full text-sm font-semibold transition cursor-pointer shadow-md shadow-emerald-500/10"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

export default Navbar;
