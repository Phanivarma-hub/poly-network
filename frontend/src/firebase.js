// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAlmqhlkLawrRyaU8_lAntnwvACHbWSfM0",
  authDomain: "campus-net-cfc4a.firebaseapp.com",
  projectId: "campus-net-cfc4a",
  storageBucket: "campus-net-cfc4a.firebasestorage.app",
  messagingSenderId: "964009879504",
  appId: "1:964009879504:web:a7c66b32353f421eb3fbd5",
  measurementId: "G-LZCWR88T11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };
