import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCOyXdZdpelVCY7pCyTlcvGzQ9l3mjLFwI",
  authDomain: "erzel-quiz.firebaseapp.com",
  databaseURL: "https://erzel-quiz-default-rtdb.firebaseio.com",
  projectId: "erzel-quiz",
  storageBucket: "erzel-quiz.firebasestorage.app",
  messagingSenderId: "565602309394",
  appId: "1:565602309394:web:248060a4e7824b39450fcb",
  measurementId: "G-SW6Y5FLBTQ"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
