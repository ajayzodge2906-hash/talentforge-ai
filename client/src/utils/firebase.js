import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "interviewiq-c9f94.firebaseapp.com",
  projectId: "interviewiq-c9f94",
  storageBucket: "interviewiq-c9f94.firebasestorage.app",
  messagingSenderId: "541656632266",
  appId: "1:541656632266:web:7b2a26c810563228741d33"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
