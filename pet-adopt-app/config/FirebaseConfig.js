// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY, // fixed typo
  authDomain: "pet-adoption-app-c97c0.firebaseapp.com",
  projectId: "pet-adoption-app-c97c0",
  storageBucket: "pet-adoption-app-c97c0.firebasestorage.app",
  messagingSenderId: "663115576893",
  appId: "1:663115576893:web:87ee311349a7db8cb05c54",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
