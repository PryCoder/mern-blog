// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "mern-blog-2193d.firebaseapp.com",
  projectId: "mern-blog-2193d",
  storageBucket: "mern-blog-2193d.appspot.com",
  messagingSenderId: "496545831138",
  appId: "1:496545831138:web:5ee42c8012bf2f44e966bb"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);