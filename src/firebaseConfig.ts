import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCcI0LG0IKUgXK6JBm3JNvQZ8OZIt-7tFk",
  authDomain: "dojoapp-3a64a.firebaseapp.com",
  databaseURL: "https://dojoapp-3a64a-default-rtdb.firebaseio.com",
  projectId: "dojoapp-3a64a",
  storageBucket: "dojoapp-3a64a.appspot.com",
  messagingSenderId: "1034534234234",
  appId: "1:1034534234234:web:1234567890abcdef"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);