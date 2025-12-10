import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { firestore } from './firebase';
import { Quiz } from '../types';

interface SavedQuiz extends Quiz {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export const saveQuiz = async (userId: string, quiz: Quiz): Promise<string> => {
  const quizId = `quiz_${Date.now()}`;
  const quizRef = doc(firestore, 'users', userId, 'quizzes', quizId);
  
  await setDoc(quizRef, {
    ...quiz,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  
  return quizId;
};

export const getQuizzes = async (userId: string): Promise<SavedQuiz[]> => {
  const quizzesRef = collection(firestore, 'users', userId, 'quizzes');
  const q = query(quizzesRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate()
  })) as SavedQuiz[];
};

export const deleteQuiz = async (userId: string, quizId: string): Promise<void> => {
  const quizRef = doc(firestore, 'users', userId, 'quizzes', quizId);
  await deleteDoc(quizRef);
};

export const updateQuiz = async (userId: string, quizId: string, quiz: Quiz): Promise<void> => {
  const quizRef = doc(firestore, 'users', userId, 'quizzes', quizId);
  await updateDoc(quizRef, {
    ...quiz,
    updatedAt: Timestamp.now()
  });
};

export const getQuiz = async (userId: string, quizId: string): Promise<SavedQuiz | null> => {
  const quizRef = doc(firestore, 'users', userId, 'quizzes', quizId);
  const snapshot = await getDoc(quizRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate(),
    updatedAt: snapshot.data().updatedAt?.toDate()
  } as SavedQuiz;
};
