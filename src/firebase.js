import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC6BAkhx_xmneaJzEH-5nkIPRO8a6eRzvo",
  authDomain: "sweet-models-db.firebaseapp.com",
  projectId: "sweet-models-db",
  storageBucket: "sweet-models-db.firebasestorage.app",
  messagingSenderId: "943808705820",
  appId: "1:943808705820:web:f457a733a760e9b2ed76d9",
  measurementId: "G-1PGY59DYNX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
