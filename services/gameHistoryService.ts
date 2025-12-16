import { collection, addDoc, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { firestore } from './firebase';
import { Player, Quiz } from '../types';

export interface GameHistory {
  id?: string;
  userId: string;
  quizTitle: string;
  quizId?: string;
  gamePin: string;
  startedAt: Date;
  endedAt: Date;
  totalPlayers: number;
  players: {
    id: string;
    name: string;
    avatar: string;
    score: number;
    rank: number;
    correctAnswers: number;
    totalAnswers: number;
  }[];
  questions: {
    text: string;
    type: string;
    correctAnswers: number;
    totalAnswers: number;
  }[];
}

export const saveGameHistory = async (
  userId: string,
  quiz: Quiz,
  gamePin: string,
  players: Player[],
  startTime: number,
  quizId?: string
): Promise<string> => {
  // Sort players by score to get ranks
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  const gameHistory: Omit<GameHistory, 'id'> = {
    userId,
    quizTitle: quiz.title,
    quizId,
    gamePin,
    startedAt: new Date(startTime),
    endedAt: new Date(),
    totalPlayers: players.length,
    players: sortedPlayers.map((player, index) => ({
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      score: player.score,
      rank: index + 1,
      correctAnswers: player.streak || 0,
      totalAnswers: quiz.questions.length
    })),
    questions: quiz.questions.map(q => ({
      text: q.text,
      type: q.type,
      correctAnswers: 0,
      totalAnswers: players.length
    }))
  };

  const historyRef = collection(firestore, 'users', userId, 'gameHistory');
  const docRef = await addDoc(historyRef, {
    ...gameHistory,
    startedAt: Timestamp.fromDate(gameHistory.startedAt),
    endedAt: Timestamp.fromDate(gameHistory.endedAt)
  });

  return docRef.id;
};

export const getGameHistory = async (userId: string): Promise<GameHistory[]> => {
  const historyRef = collection(firestore, 'users', userId, 'gameHistory');
  const q = query(historyRef, orderBy('endedAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    startedAt: doc.data().startedAt?.toDate(),
    endedAt: doc.data().endedAt?.toDate()
  })) as GameHistory[];
};

export const getQuizHistory = async (userId: string, quizId: string): Promise<GameHistory[]> => {
  const historyRef = collection(firestore, 'users', userId, 'gameHistory');
  const q = query(historyRef, where('quizId', '==', quizId));
  const snapshot = await getDocs(q);

  // Sort in memory instead of using Firestore orderBy to avoid index requirement
  const history = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    startedAt: doc.data().startedAt?.toDate(),
    endedAt: doc.data().endedAt?.toDate()
  })) as GameHistory[];

  // Sort by endedAt descending
  return history.sort((a, b) => b.endedAt.getTime() - a.endedAt.getTime());
};
