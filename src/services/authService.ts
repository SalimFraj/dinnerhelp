import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    type User,
} from 'firebase/auth';
import { auth } from '../config/firebase';

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

// Convert Firebase User to AuthUser
const toAuthUser = (user: User): AuthUser => ({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
});

// Email/Password Sign Up
export async function signUp(
    email: string,
    password: string,
    displayName?: string
): Promise<AuthUser> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    if (displayName) {
        await updateProfile(credential.user, { displayName });
    }

    return toAuthUser(credential.user);
}

// Email/Password Sign In
export async function signIn(email: string, password: string): Promise<AuthUser> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return toAuthUser(credential.user);
}

// Google Sign In
export async function signInWithGoogle(): Promise<AuthUser> {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    return toAuthUser(credential.user);
}

// Sign Out
export async function signOut(): Promise<void> {
    await firebaseSignOut(auth);
}

// Get Current User
export function getCurrentUser(): AuthUser | null {
    const user = auth.currentUser;
    return user ? toAuthUser(user) : null;
}

// Auth State Listener
export function onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
        callback(user ? toAuthUser(user) : null);
    });
}
