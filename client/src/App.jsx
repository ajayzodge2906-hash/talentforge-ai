import React, { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import InterviewSession from './pages/InterviewSession.jsx'
import InterviewFeedback from './pages/InterviewFeedback.jsx'
import Pricing from './pages/Pricing.jsx'
import ResumeUpload from './pages/ResumeUpload.jsx'
import Analytics from './pages/Analytics.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { setUserData } from './redux/userSlice.js'

export const ServerUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000"

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await axios.get(ServerUrl + "/api/user/current-user", { withCredentials: true })
        dispatch(setUserData(result.data))
      } catch (error) {
        console.log("Not logged in or session expired:", error.message)
        dispatch(setUserData(null))
      }
    }
    getUser();
  }, [dispatch])

  return (
    <Routes>  
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/interview/:id" element={<InterviewSession />} />
      <Route path="/interview/feedback/:id" element={<InterviewFeedback />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/resume" element={<ResumeUpload />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  )
}

export default App;
