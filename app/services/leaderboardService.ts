import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  score: number;
  lines: number;
  level: number;
  updatedAt?: any;
  rank?: number;
}

export interface SubmitScoreResult {
  savedToCloud: boolean;
  isNewPersonalBest: boolean;
  currentRank?: number;
}

class LeaderboardService {
  private collectionName = "leaderboard";

  /**
   * Fetch top players from Cloud Firestore
   * Accessible by both authenticated players and local guest players.
   */
  async fetchTopLeaderboard(limitCount: number = 50): Promise<LeaderboardEntry[]> {
    try {
      // Use single-field ordering to avoid requiring a manual Firestore composite index
      const q = query(
        collection(db, this.collectionName),
        orderBy("score", "desc"),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as LeaderboardEntry;
        entries.push({
          ...data,
          uid: docSnap.id,
        });
      });

      // Perform secondary sort on lines in memory
      entries.sort((a, b) => b.score - a.score || (b.lines || 0) - (a.lines || 0));

      // Assign sequential ranks
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return entries;
    } catch (error) {
      console.warn("[Leaderboard] Failed to fetch top scores:", error);
      return [];
    }
  }

  /**
   * Fetch leaderboard entries for a specific list of user IDs (Friends + Self)
   */
  async fetchFriendsLeaderboard(uids: string[]): Promise<LeaderboardEntry[]> {
    if (!uids || uids.length === 0) return [];
    try {
      const entries: LeaderboardEntry[] = [];

      // Fetch each friend's leaderboard doc in parallel
      const docPromises = uids.map((uid) =>
        getDoc(doc(db, this.collectionName, uid))
      );
      const snaps = await Promise.all(docPromises);

      snaps.forEach((snap) => {
        if (snap.exists()) {
          const data = snap.data() as LeaderboardEntry;
          entries.push({
            ...data,
            uid: snap.id,
          });
        }
      });

      // Sort by score and lines
      entries.sort((a, b) => b.score - a.score || (b.lines || 0) - (a.lines || 0));

      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return entries;
    } catch (error) {
      console.warn("[Leaderboard] Failed to fetch friends scores:", error);
      return [];
    }
  }

  /**
   * Submit score to cloud ONLY if the user is authenticated.
   * If user is a local/guest account, DO NOT SAVE TO CLOUD.
   */
  async submitScoreIfAuthenticated(
    score: number,
    lines: number,
    level: number
  ): Promise<SubmitScoreResult> {
    const user = auth.currentUser;

    // Rule: Local account does NOT save to cloud
    if (!user) {
      return {
        savedToCloud: false,
        isNewPersonalBest: false,
      };
    }

    try {
      const userDocRef = doc(db, this.collectionName, user.uid);
      const existingSnap = await getDoc(userDocRef);

      let isNewPersonalBest = true;
      if (existingSnap.exists()) {
        const existingData = existingSnap.data() as LeaderboardEntry;
        if (existingData.score >= score) {
          isNewPersonalBest = false;
          // Only update if current score beats existing personal record
          return {
            savedToCloud: false,
            isNewPersonalBest: false,
          };
        }
      }

      const displayName =
        user.displayName ||
        (user.email ? user.email.split("@")[0] : `Player_${user.uid.slice(0, 5)}`);

      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          displayName,
          photoURL: user.photoURL || null,
          score,
          lines,
          level,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return {
        savedToCloud: true,
        isNewPersonalBest,
      };
    } catch (error) {
      console.error("[Leaderboard] Error submitting score:", error);
      return {
        savedToCloud: false,
        isNewPersonalBest: false,
      };
    }
  }

  /**
   * Get authenticated user's current cloud score & rank
   */
  async getUserCloudEntry(uid: string): Promise<LeaderboardEntry | null> {
    try {
      const userDocRef = doc(db, this.collectionName, uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        return snap.data() as LeaderboardEntry;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

export const leaderboardService = new LeaderboardService();
export default leaderboardService;
