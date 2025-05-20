import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAfTyc7HCyRtSUO4bzdtxp_wH_ipNBuYOw",
  authDomain: "ai-rh-platform.firebaseapp.com",
  projectId: "ai-rh-platform",
  storageBucket: "ai-rh-platform.firebasestorage.app",
  messagingSenderId: "960665959797",
  appId: "1:960665959797:web:d88deeb8fa417ba2ea273c",
  measurementId: "G-HF7GG2J11R"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
