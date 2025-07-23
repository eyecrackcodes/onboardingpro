import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyANJ_tI3CDviROW6rGZiskFZH0BS7WuHPM",
  authDomain: "onboarding-tracker-c16cc.firebaseapp.com",
  projectId: "onboarding-tracker-c16cc",
  storageBucket: "onboarding-tracker-c16cc.firebasestorage.app",
  messagingSenderId: "200361506669",
  appId: "1:200361506669:web:827545f6cbbadab5148c64",
  measurementId: "G-XJ797GRGDN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;
