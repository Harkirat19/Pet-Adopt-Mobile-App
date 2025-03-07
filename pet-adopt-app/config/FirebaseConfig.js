// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
import {getFirestore} from "firebase/firestore";
import {getAnalytics} from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBILC_FIREBASE_API_KEY,
  authDomain: "pet-adoption-app-c97c0.firebaseapp.com",
  projectId: "pet-adoption-app-c97c0",
  storageBucket: "pet-adoption-app-c97c0.firebasestorage.app",
  messagingSenderId: "663115576893",
  appId: "1:663115576893:web:87ee311349a7db8cb05c54",
  measurementId: "G-JBF9J31Z88",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
// const analytics = getAnalytics(app);
