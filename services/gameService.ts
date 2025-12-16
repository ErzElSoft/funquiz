import { ref, set, onValue, update, remove, get } from 'firebase/database';
import { database } from './firebase';
import { HostStatePayload, Player } from '../types';

export const createGame = async (pin: string) => {
  const gameRef = ref(database, `games/${pin}`);
  await set(gameRef, {
    pin,
    createdAt: Date.now(),
    players: {},
    hostState: null
  });
};

export const joinGame = async (pin: string, player: Player) => {
  const playerRef = ref(database, `games/${pin}/players/${player.id}`);
  await set(playerRef, player);
};

export const updateHostState = async (pin: string, hostState: HostStatePayload) => {
  const hostStateRef = ref(database, `games/${pin}/hostState`);
  await set(hostStateRef, hostState);
};

export const listenToHostState = (pin: string, callback: (hostState: HostStatePayload | null) => void) => {
  const hostStateRef = ref(database, `games/${pin}/hostState`);
  return onValue(hostStateRef, (snapshot) => {
    callback(snapshot.val());
  });
};

export const listenToPlayers = (pin: string, callback: (players: Player[]) => void) => {
  const playersRef = ref(database, `games/${pin}/players`);
  return onValue(playersRef, (snapshot) => {
    const playersData = snapshot.val();
    const playersList = playersData ? Object.values(playersData) as Player[] : [];
    callback(playersList);
  });
};

export const submitAnswer = async (pin: string, playerId: string, answer: { answerIndex?: number; answerText?: string; timeRemaining: number }) => {
  const answerRef = ref(database, `games/${pin}/answers/${playerId}`);
  await set(answerRef, answer);
};

export const listenToAnswers = (pin: string, callback: (answers: Record<string, any>) => void) => {
  const answersRef = ref(database, `games/${pin}/answers`);
  return onValue(answersRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
};

export const clearAnswers = async (pin: string) => {
  const answersRef = ref(database, `games/${pin}/answers`);
  await remove(answersRef);
};

export const deleteGame = async (pin: string) => {
  const gameRef = ref(database, `games/${pin}`);
  await remove(gameRef);
};

export const checkGameExists = async (pin: string): Promise<boolean> => {
  const gameRef = ref(database, `games/${pin}`);
  const snapshot = await get(gameRef);
  return snapshot.exists();
};

export const checkPlayerAnswered = async (pin: string, playerId: string): Promise<boolean> => {
  const answerRef = ref(database, `games/${pin}/answers/${playerId}`);
  const snapshot = await get(answerRef);
  return snapshot.exists();
};
