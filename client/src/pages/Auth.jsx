import React, { useState, useEffect } from 'react'
import { BsRobot } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { motion, AnimatePresence } from "motion/react"
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from '../utils/firebase.js';
import axios from 'axios';
import { ServerUrl } from '../App';
import { useDispatch, useSelector } from 'react-redux';
import { setUserData } from '../redux/userSlice.js';
import { useNavigate } from 'react-router-dom';

function Auth() {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({ name: '', email: '', password: '', gender: 'male' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (userData) {
      navigate('/dashboard');
    }
  }, [userData, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = activeTab === 'login' 
      ? { email: formData.email, password: formData.password } 
      : { name: formData.name, email: formData.email, password: formData.password, gender: formData.gender || 'male' };

    try {
      const result = await axios.post(ServerUrl + endpoint, payload, { withCredentials: true });
      dispatch(setUserData(result.data));
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      setLoading(true);
      const response = await signInWithPopup(auth, provider);
      const user = response.user;
      const name = user.displayName;
      const email = user.email;
      const result = await axios.post(ServerUrl + "/api/auth/google", { name, email }, { withCredentials: true });
      dispatch(setUserData(result.data));
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      setErrorMsg('Google Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!formData.email) {
      setErrorMsg('Please enter your email address in the input field first.');
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(ServerUrl + "/api/auth/forgot-password", { email: formData.email });
      setSuccessMsg(res.data.message);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error executing forgot password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0b0f19] flex items-center justify-center px-4 py-12 select-none font-sans text-gray-150">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-3xl bg-gray-900/40 shadow-2xl border border-gray-800/80 flex flex-col backdrop-blur-md"
      >
        {/* Logo Banner */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-gradient-to-tr from-emerald-500 to-blue-500 text-white w-9 h-9 rounded-xl shadow-md shadow-emerald-500/10 flex items-center justify-center font-extrabold text-xs tracking-tight">
            AZ
          </div>
          <h2 className="font-extrabold text-xl bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            TalentForge AI
          </h2>
        </div>

        <h1 className="text-xl md:text-2xl font-extrabold text-center text-white leading-snug mb-2">
          Practice. Analyze. Get Hired.
        </h1>
        <p className="text-gray-400 text-center text-xs mb-6 leading-relaxed max-w-xs mx-auto">
          Sign in to access voice mock interviews, resume ATS evaluations, and performance analytics.
        </p>

        {/* Tab Selector */}
        <div className="flex bg-gray-950 p-1 rounded-xl mb-6 border border-gray-800">
          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'login' ? 'bg-gray-800 text-emerald-400' : 'text-gray-400 hover:text-gray-250'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'register' ? 'bg-gray-800 text-emerald-400' : 'text-gray-400 hover:text-gray-250'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl p-3 mb-4">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl p-3 mb-4">
            {successMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {activeTab === 'register' && (
              <>
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-1.5"
                >
                  <label className="text-xs font-bold text-gray-400">Name</label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white transition"
                  />
                </motion.div>

                <motion.div
                  key="gender-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-1.5"
                >
                  <label className="text-xs font-bold text-gray-400">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white transition bg-gray-950"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400">Email Address</label>
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="name@company.com"
              className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-400">Password</label>
              {activeTab === 'login' && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-355 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <input
              required
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:opacity-95 text-white font-semibold rounded-xl text-sm transition cursor-pointer mt-2 shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>{activeTab === 'login' ? 'Sign In' : 'Sign Up'}</span>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="flex items-center gap-3 my-6 text-xs text-gray-500 font-semibold">
          <hr className="flex-1 border-gray-800" />
          <span>or continue with</span>
          <hr className="flex-1 border-gray-800" />
        </div>

        {/* Google Trigger */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 bg-gray-950 border border-gray-800 hover:bg-gray-850 hover:bg-gray-900 text-gray-300 font-semibold rounded-xl transition cursor-pointer shadow-xs"
        >
          <FcGoogle size={18} />
          <span className="text-sm">Google Login</span>
        </button>
      </motion.div>
    </div>
  )
}

export default Auth;
