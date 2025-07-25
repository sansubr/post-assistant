// Import the functions you need from the SDKs
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCFx24dVA2HEUk4DaiF17Yzz-oDCGBXp2A",
  authDomain: "blinkpost-ed598.firebaseapp.com",
  projectId: "blinkpost-ed598",
  storageBucket: "blinkpost-ed598.firebasestorage.app",
  messagingSenderId: "933782476754",
  appId: "1:933782476754:web:d1a4c04dbbab9a78431a0b",
  measurementId: "G-RCTK1JW95E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Export the auth and database instances so other scripts can use them
export { auth, db };