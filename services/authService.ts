import { signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from './firebase';

export const login = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export { auth };
