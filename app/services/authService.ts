import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from "firebase/auth";
import { auth } from "./firebaseConfig";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export function formatAuthError(error: any): string {
  const code = error?.code || "";
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is not enabled in Firebase Console.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    default:
      return error?.message || "An authentication error occurred.";
  }
}

class AuthService {
  // Sign up with Email and Password
  async signUpWithEmail(
    email: string,
    pass: string,
    displayName: string
  ): Promise<User> {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      pass
    );
    if (displayName.trim()) {
      await updateProfile(credential.user, {
        displayName: displayName.trim(),
      });
    }
    return credential.user;
  }

  // Sign in with Email and Password
  async signInWithEmail(email: string, pass: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      pass
    );
    return credential.user;
  }

  // Sign in with Google Credential (idToken)
  async signInWithGoogleCredential(idToken: string): Promise<User> {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  }

  // Send Password Reset
  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  }

  // Sign Out
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  // Get current logged-in user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Listen to auth state changes
  subscribeToAuthState(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }
}

export const authService = new AuthService();
export default authService;
