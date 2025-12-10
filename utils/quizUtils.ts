import { Quiz, Question } from '../types';

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Shuffles quiz questions randomly
 */
export const shuffleQuizQuestions = (quiz: Quiz): Quiz => {
  return {
    ...quiz,
    questions: shuffleArray(quiz.questions)
  };
};

/**
 * Calculates game duration in minutes and seconds
 */
export const calculateGameDuration = (startTime: number, endTime: number): string => {
  const durationMs = endTime - startTime;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};
