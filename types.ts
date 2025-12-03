export enum GameState {
  MENU = 'MENU',         // Host: Create Quiz
  LOBBY = 'LOBBY',       // Host: Waiting for players, Player: Waiting for start
  QUESTION = 'QUESTION', // Host: Show Question, Player: Show Buttons
  REVEAL = 'REVEAL',     // Host: Show Graph, Player: Show Correct/Incorrect
  LEADERBOARD = 'LEADERBOARD',
  FINISH = 'FINISH'
}

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'FILL_IN_THE_BLANK';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: string[]; // MC/TF: Choices. Text: Acceptable answers.
  correctIndex: number; // -1 for Text types
  timeLimit: number;
}

export interface Quiz {
  title: string;
  topic: string;
  questions: Question[];
}

export interface Player {
  id: string;
  name: string;
  score: number;
  streak: number;
  lastAnswerCorrect?: boolean;
  avatar?: string;
}

// Communication Protocol
export type ChannelMessage = 
  | { type: 'HOST_STATE_UPDATE'; payload: HostStatePayload }
  | { type: 'PLAYER_JOIN'; payload: { name: string; pin: string; id: string; avatar?: string } }
  | { type: 'PLAYER_ANSWER'; payload: { playerId: string; answerIndex?: number; answerText?: string; timeRemaining: number } };

export interface HostStatePayload {
  pin: string;
  gameState: GameState;
  currentQuestion?: Question; // Sent during QUESTION phase
  timeLeft?: number;
  players?: Player[]; // Sent to lobby to show list
  resultInfo?: { correctIndex: number; correctText?: string }; // Sent during REVEAL
}