// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.XPO_PUBILC_FIREBAS_API_KEY,
  authDomain: "pet-adopt-50803.firebaseapp.com",
  projectId: "pet-adopt-50803",
  storageBucket: "pet-adopt-50803.firebasestorage.app",
  messagingSenderId: "459757484084",
  appId: "1:459757484084:web:256cbff647d5def3a3f261",
  measurementId: "G-6XXJZZV35N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);