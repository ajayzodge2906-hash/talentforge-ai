import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import axios from 'axios'
import { ServerUrl } from '../App'
import Navbar from '../components/Navbar'
import { setUserData } from '../redux/userSlice'
import { BsCoin, BsCheck, BsArrowRight, BsShieldFillCheck, BsArrowLeft, BsCreditCard2Back, BsChevronRight } from 'react-icons/bs'
import { FaMobileAlt, FaBuilding, FaWallet, FaHourglassEnd } from 'react-icons/fa'

function Pricing() {
  const { userData } = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [purchasing, setPurchasing] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [newCredits, setNewCredits] = useState(0)

  // Razorpay simulation states
  const [mockModeActive, setMockModeActive] = useState(false)
  const [razorpayStep, setRazorpayStep] = useState(null) // 'loader', 'options', 'otp', 'bank', 'success'
  const [paymentPlan, setPaymentPlan] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentCredits, setPaymentCredits] = useState(0)
  const [pendingUserObj, setPendingUserObj] = useState(null)
  
  // Form fields for mock checkout
  const [phone, setPhone] = useState('95691 02933')
  const [otp, setOtp] = useState(['', '', '', ''])

  const plans = [
    {
      name: "Starter Bundle",
      dbPlan: "starter",
      credits: 150,
      price: "₹100",
      features: [
        "15 Full AI Mock Interviews",
        "TalentForge AI questions generation",
        "Detailed performance grading",
        "Speech-to-Text transcription"
      ],
      popular: false
    },
    {
      name: "Professional Bundle",
      dbPlan: "pro",
      credits: 650,
      price: "₹500",
      features: [
        "65 Full AI Mock Interviews",
        "TalentForge AI questions generation",
        "Detailed performance grading",
        "Speech-to-Text transcription",
        "Optimal code response suggestions"
      ],
      popular: true
    },
    {
      name: "Enterprise Prep",
      dbPlan: "pro",
      credits: 650,
      price: "₹500",
      features: [
        "65 Full AI Mock Interviews",
        "TalentForge AI questions generation",
        "Detailed performance grading",
        "Speech-to-Text transcription",
        "Optimal code response suggestions",
        "Priority AI server response speeds"
      ],
      popular: false
    }
  ]

  const handlePurchase = async (planName, dbPlan, priceStr, creditsAmount) => {
    if (!userData) {
      navigate('/auth')
      return
    }

    const numericPrice = priceStr === "₹100" ? 100 : 500

    try {
      setPurchasing(true)
      const res = await axios.post(`${ServerUrl}/api/payments/create`, { plan: dbPlan }, { withCredentials: true })
      
      if (res.data.mock) {
        // Mock mode from backend
        setPaymentPlan(planName)
        setPaymentAmount(numericPrice)
        setPaymentCredits(creditsAmount)
        setPendingUserObj(res.data.user)
        
        // Start simulated Razorpay overlay
        setMockModeActive(true)
        setRazorpayStep('loader')
        
        setTimeout(() => {
          setRazorpayStep('options')
        }, 1500)
      } else {
        // Real Razorpay integration
        const options = {
          key: res.data.keyId,
          amount: res.data.amount,
          currency: res.data.currency,
          name: "TalentForge AI",
          description: `Purchase ${creditsAmount} credits`,
          order_id: res.data.orderId,
          handler: async function (response) {
            try {
              setPurchasing(true)
              const verifyRes = await axios.post(`${ServerUrl}/api/payments/verify`, {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              }, { withCredentials: true })

              dispatch(setUserData(verifyRes.data.user))
              setNewCredits(verifyRes.data.user.credits)
              setSuccessModal(true)
            } catch (err) {
              alert("Verification failed: " + err.message)
            } finally {
              setPurchasing(false)
            }
          },
          prefill: {
            name: userData.name,
            email: userData.email,
            contact: phone
          },
          theme: {
            color: "#10b981"
          }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
      }
    } catch (err) {
      console.error("Purchase error:", err)
      alert("Order creation failed. Ensure your server is running.")
    } finally {
      setPurchasing(false)
    }
  }

  const handleMockSuccess = () => {
    setRazorpayStep('success')
    
    // Simulate redirection and update credit balance in state
    setTimeout(() => {
      setMockModeActive(false)
      setRazorpayStep(null)
      if (pendingUserObj) {
        dispatch(setUserData(pendingUserObj))
        setNewCredits(pendingUserObj.credits)
        setSuccessModal(true)
      }
    }, 2500)
  }

  const handleMockFailure = () => {
    setMockModeActive(false)
    setRazorpayStep(null)
    alert("Simulated transaction cancelled/failed. Credits were not updated.")
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col font-sans select-none pb-16 text-gray-150 relative">
      <Navbar />

      <div className="w-full max-w-6xl mx-auto px-4 mt-8 flex-1 flex flex-col items-center gap-6">
        {/* Navigation / Actions Header */}
        <div className="flex justify-between items-center w-full">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800 px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer backdrop-blur-md"
          >
            <BsArrowLeft size={14} className="text-gray-405" />
            <span>Back to Dashboard</span>
          </button>
        </div>
        {/* Header Title */}
        <div className="text-center max-w-2xl mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base leading-relaxed">
            Practice mock interviews at your own pace. Buy credit bundles to generate AI questions and grade your answers.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5, boxShadow: "0 12px 30px -8px rgba(16, 185, 129, 0.08)" }}
              className={`bg-gray-900/40 rounded-3xl p-6 md:p-8 border flex flex-col justify-between gap-6 relative transition shadow-md backdrop-blur-md ${
                plan.popular ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-gray-800/80'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-md">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                
                {/* Credit Counter */}
                <div className="flex items-center gap-2 mt-4 text-emerald-400">
                  <BsCoin className="text-emerald-400 animate-pulse" size={24} />
                  <span className="text-2xl font-extrabold">{plan.credits}</span>
                  <span className="text-gray-400 font-bold text-xs uppercase tracking-wide">credits</span>
                </div>

                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-gray-500 text-xs font-medium"> / one-time</span>
                </div>

                {/* Features Checkmark list */}
                <div className="border-t border-gray-800 pt-6 mt-6 flex flex-col gap-3">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <div className="bg-gray-800 rounded-full p-0.5 mt-0.5 text-emerald-400">
                        <BsCheck size={14} />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handlePurchase(plan.name, plan.dbPlan, plan.price, plan.credits)}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-extrabold cursor-pointer transition shadow-sm ${
                  plan.popular
                    ? 'bg-gradient-to-r from-emerald-600 to-blue-600 hover:brightness-110 text-white'
                    : 'bg-gray-850 hover:bg-gray-800 border border-gray-800 text-gray-300 bg-transparent'
                }`}
              >
                <span>Buy Bundle</span>
                <BsArrowRight size={13} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Purchase Success Modal */}
      <AnimatePresence>
        {successModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center flex flex-col items-center justify-center gap-5 text-gray-150"
            >
              <div className="bg-emerald-500/10 border border-emerald-500/20 w-16 h-16 rounded-full flex items-center justify-center shadow-inner text-emerald-400 animate-bounce">
                <BsCoin size={32} />
              </div>
              
              <div>
                <h3 className="font-extrabold text-xl text-white">Purchase Completed!</h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  Your mock payment went through successfully! We have credited **{paymentCredits} credits** to your account.
                </p>
                <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 mt-4 text-xs font-semibold flex justify-between items-center">
                  <span>New Balance:</span>
                  <span className="flex items-center gap-1 text-white font-bold text-sm">
                    <BsCoin className="text-emerald-450 text-emerald-400" size={14} />
                    <span>{newCredits} credits</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSuccessModal(false)
                  navigate('/dashboard')
                }}
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:opacity-90 font-semibold py-3 rounded-xl text-xs transition cursor-pointer"
              >
                Back to Dashboard
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real Checkout Loader Overlay */}
      <AnimatePresence>
        {purchasing && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 p-6 rounded-2xl flex items-center gap-3.5 shadow-xl border border-gray-800">
              <div className="w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-bold text-white">Processing transaction...</span>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          HIGH-FIDELITY INTERACTIVE RAZORPAY MODAL SIMULATOR
          ======================================================== */}
      <AnimatePresence>
        {mockModeActive && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            
            {/* 1. INITIAL SHIELD LOADER SCREEN */}
            {razorpayStep === 'loader' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-2xl min-h-[420px] shadow-2xl flex flex-col items-center justify-center p-8 relative"
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <BsShieldFillCheck size={48} className="text-blue-600 absolute" />
                </div>
                <div className="absolute bottom-6 flex items-center gap-2 text-xs text-gray-400 font-semibold">
                  <span>Secured by</span>
                  <span className="font-extrabold text-blue-700 italic">Razorpay</span>
                </div>
              </motion.div>
            )}

            {/* 2. PAYMENT METHODS & FORM SCREEN */}
            {razorpayStep === 'options' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-gray-800 border border-gray-100"
              >
                {/* Left Side: Summary Panel */}
                <div className="w-full md:w-5/12 bg-emerald-600 text-white p-6 flex flex-col justify-between relative">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">Test Mode</span>
                      <span>TalentForge AI</span>
                    </div>
                    
                    <div className="mt-8">
                      <span className="text-[10px] text-emerald-100 uppercase font-bold tracking-wider block">Price Summary</span>
                      <span className="text-3xl font-black block mt-1">₹{paymentAmount}</span>
                    </div>
                  </div>

                  <div className="mt-12 md:mt-24 bg-white/10 rounded-xl p-3.5 border border-white/10 text-xs">
                    <span className="block font-semibold">Prefilled Contact:</span>
                    <span className="block mt-1 font-bold">Using as +91 {phone}</span>
                  </div>
                  
                  <div className="absolute bottom-4 left-6 text-[9px] text-emerald-200">
                    Secured by <span className="font-bold">Razorpay</span>
                  </div>
                </div>

                {/* Right Side: Options Panel */}
                <div className="w-full md:w-7/12 p-6 flex flex-col justify-between min-h-[380px]">
                  <div>
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                      <h3 className="font-bold text-sm text-gray-800">Payment Options</h3>
                      <button onClick={handleMockFailure} className="text-gray-450 hover:text-gray-600 text-xs font-bold">✕</button>
                    </div>

                    {/* Method Tabs */}
                    <div className="flex flex-col gap-2 mt-4 text-xs font-semibold text-gray-600">
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-150 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BsCreditCard2Back size={16} className="text-blue-500" />
                          <span>Cards (Visa, Mastercard, RuPay)</span>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase">Popular</span>
                      </div>

                      {/* Card Details Inputs */}
                      <div className="p-3 border border-gray-150 rounded-xl flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-gray-400 uppercase font-bold">Card Number</span>
                          <input type="text" value="4111 1111 1111 1111" disabled className="w-full bg-gray-550/10 p-2 border border-gray-200 rounded text-xs focus:outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-gray-400 uppercase font-bold">Expiry</span>
                            <input type="text" value="12/28" disabled className="w-full bg-gray-550/10 p-2 border border-gray-200 rounded text-xs focus:outline-none text-center" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-gray-400 uppercase font-bold">CVV</span>
                            <input type="password" value="•••" disabled className="w-full bg-gray-550/10 p-2 border border-gray-200 rounded text-xs focus:outline-none text-center" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setRazorpayStep('otp')}
                    className="w-full mt-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Continue</span>
                    <BsChevronRight size={10} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* 3. SECURELY SAVING / OTP LOADING SCREEN */}
            {razorpayStep === 'otp' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-gray-800 border border-gray-100 min-h-[380px]"
              >
                {/* Left Side (Same as option) */}
                <div className="w-full md:w-5/12 bg-emerald-600 text-white p-6 flex flex-col justify-between relative">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">Test Mode</span>
                      <span>TalentForge AI</span>
                    </div>
                    <div className="mt-8">
                      <span className="text-[10px] text-emerald-100 uppercase font-bold tracking-wider block">Price Summary</span>
                      <span className="text-3xl font-black block mt-1">₹{paymentAmount}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-6 text-[9px] text-emerald-200">
                    Secured by <span className="font-bold">Razorpay</span>
                  </div>
                </div>

                {/* Right Side: OTP Input Simulation */}
                <div className="w-full md:w-7/12 p-8 flex flex-col justify-between items-center text-center">
                  <div className="w-full flex flex-col items-center">
                    <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-full text-emerald-600 mb-4 animate-pulse">
                      <BsShieldFillCheck size={28} />
                    </div>
                    
                    <h3 className="font-extrabold text-base text-gray-800">Securely saving your card</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                      OTP sent to +91{phone} for your card ending with ****1007
                    </p>

                    {/* Numeric Input placeholders */}
                    <div className="flex gap-2 justify-center mt-6">
                      {[1, 2, 3, 4].map((boxIdx) => (
                        <div key={boxIdx} className="w-10 h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-sm font-black text-gray-850">
                          {boxIdx === 1 ? '5' : boxIdx === 2 ? '6' : boxIdx === 3 ? '9' : '1'}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between w-full max-w-xs mt-6 text-[10px] text-gray-400 font-semibold px-2">
                      <button type="button" onClick={() => setRazorpayStep('bank')} className="text-blue-600 hover:underline">Skip OTP</button>
                      <span>Resend OTP in 27s</span>
                    </div>
                  </div>

                  <div className="w-full flex flex-col items-center gap-1 mt-6">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mt-1">Detecting OTP</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. DEMO BANK CHOICES PAGE */}
            {razorpayStep === 'bank' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-2xl min-h-[420px] shadow-2xl overflow-hidden flex flex-col justify-between text-gray-800 border border-gray-200"
              >
                {/* Bank Header Banner */}
                <div className="bg-gray-50 border-b border-gray-150 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-black text-xl italic shadow-md">
                      r
                    </div>
                    <div>
                      <h2 className="font-extrabold text-sm text-gray-800">Razorpay Software Private Ltd Bank</h2>
                      <span className="text-[10px] text-gray-400 font-semibold block">Gateway Integration Sandbox</span>
                    </div>
                  </div>
                  <button onClick={handleMockFailure} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                </div>

                {/* Bank Body */}
                <div className="p-8 text-center flex-1 flex flex-col justify-center items-center gap-4">
                  <h3 className="font-extrabold text-lg text-gray-800">Authorize Simulated Transaction</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-md">
                    This is just a demo bank page. You can choose whether to make this simulated payment successful or not. Clicking Success will mock-grant credentials.
                  </p>

                  <div className="flex gap-4 mt-6 w-full max-w-xs">
                    <button
                      onClick={handleMockSuccess}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm shadow-emerald-500/10"
                    >
                      Success
                    </button>
                    <button
                      onClick={handleMockFailure}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-650 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm shadow-red-500/10"
                    >
                      Failure
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 text-center text-[10px] text-gray-400 font-medium">
                  This simulated bank process securely emulates standard Razorpay redirects.
                </div>
              </motion.div>
            )}

            {/* 5. PAYMENT SUCCESS CARD OVERLAY */}
            {razorpayStep === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-emerald-600 rounded-3xl w-full max-w-lg min-h-[380px] shadow-2xl p-8 flex flex-col items-center justify-between text-white border border-emerald-500"
              >
                {/* Dummy spacing */}
                <div></div>

                <div className="flex flex-col items-center text-center">
                  <div className="bg-white text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center shadow-lg mb-4 animate-bounce">
                    <BsCheck size={48} className="stroke-[1.5]" />
                  </div>
                  
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-250 block">Transaction Success</span>
                  <h2 className="text-2xl font-black mt-2">Payment Successful</h2>
                  <p className="text-xs text-emerald-100 mt-2">
                    You will be redirected in 1 seconds.
                  </p>

                  {/* Summary Block */}
                  <div className="bg-white/10 rounded-2xl p-4 mt-6 text-left text-xs min-w-[280px] border border-white/10 flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-emerald-100 font-semibold">Vendor:</span>
                      <span className="font-bold">TalentForge AI</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-100 font-semibold">Amount Paid:</span>
                      <span className="font-bold">₹{paymentAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-100 font-semibold">Reference ID:</span>
                      <span className="font-mono">pay_SHBmsW7kcX5tqz</span>
                    </div>
                  </div>
                </div>

                <div className="text-[9px] text-emerald-200">
                  Secured by <span className="font-bold">Razorpay</span>
                </div>
              </motion.div>
            )}

          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Pricing;
