import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export type RecommendationCategory =
  | "related"
  | "rival"
  | "pro_master"
  | "lower_tier";

export interface UserFriendProfile {
  uid: string;
  friendCode: string;
  displayName: string;
  photoURL?: string | null;
  highScore?: number;
  lines?: number;
  level?: number;
  location?: string | null;
  relatives?: string[] | null;
  updatedAt?: any;
}

export interface FriendRequest {
  id: string;
  senderUid: string;
  senderName: string;
  senderCode: string;
  receiverUid: string;
  receiverName: string;
  status: "pending" | "accepted" | "declined";
  createdAt?: any;
}

export interface RecommendedFriend {
  profile: UserFriendProfile;
  scoreDiff: number;
  scoreComparison: string;
  similarityPercentage: number;
  category: RecommendationCategory;
  badgeLabel: string;
  badgeType: "nearby" | "rival" | "pro" | "lower";
}

class FriendService {
  private usersCollection = "users";
  private requestsCollection = "friend_requests";

  /**
   * Format a predictable Friend Code from UID
   * e.g. "TR-A9B42C"
   */
  formatFriendCode(uid: string): string {
    const clean = uid.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const sub = (clean + "ABCDEF123456").substring(0, 6);
    return `TR-${sub}`;
  }

  /**
   * Get or initialize current user's profile with Friend Code
   */
  async ensureUserProfile(
    uid: string,
    displayName?: string
  ): Promise<UserFriendProfile> {
    const userDocRef = doc(db, this.usersCollection, uid);
    const snap = await getDoc(userDocRef);

    const friendCode = this.formatFriendCode(uid);
    const name = displayName || auth.currentUser?.displayName || "Player";

    if (snap.exists()) {
      const data = snap.data() as UserFriendProfile;
      // Ensure friendCode is set
      if (!data.friendCode) {
        await updateDoc(userDocRef, { friendCode });
        return { ...data, friendCode };
      }
      return data;
    }

    const newProfile: UserFriendProfile = {
      uid,
      friendCode,
      displayName: name,
      photoURL: auth.currentUser?.photoURL || null,
      updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, newProfile, { merge: true });
    return newProfile;
  }

  /**
   * Search for a player by their exact Friend Code (e.g. "TR-A9B42C")
   */
  async searchByFriendCode(code: string): Promise<UserFriendProfile | null> {
    const formatted = code.trim().toUpperCase();
    try {
      const q = query(
        collection(db, this.usersCollection),
        where("friendCode", "==", formatted),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as UserFriendProfile;
      }
      return null;
    } catch (error) {
      console.warn("[FriendService] Search by code failed:", error);
      return null;
    }
  }

  /**
   * Send a friend request to target player
   */
  async sendFriendRequest(targetProfile: UserFriendProfile): Promise<boolean> {
    const current = auth.currentUser;
    if (!current) return false;
    if (current.uid === targetProfile.uid) return false;

    try {
      // Ensure current user profile is registered
      const myProfile = await this.ensureUserProfile(current.uid);

      const requestId = `${current.uid}_${targetProfile.uid}`;
      const requestRef = doc(db, this.requestsCollection, requestId);

      await setDoc(requestRef, {
        id: requestId,
        senderUid: current.uid,
        senderName: myProfile.displayName,
        senderCode: myProfile.friendCode,
        receiverUid: targetProfile.uid,
        receiverName: targetProfile.displayName,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("[FriendService] Error sending friend request:", error);
      return false;
    }
  }

  /**
   * Accept an incoming friend request
   */
  async acceptFriendRequest(request: FriendRequest): Promise<boolean> {
    try {
      const requestRef = doc(db, this.requestsCollection, request.id);
      await updateDoc(requestRef, {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("[FriendService] Error accepting request:", error);
      return false;
    }
  }

  /**
   * Decline or cancel a friend request
   */
  async declineFriendRequest(requestId: string): Promise<boolean> {
    try {
      const requestRef = doc(db, this.requestsCollection, requestId);
      await deleteDoc(requestRef);
      return true;
    } catch (error) {
      console.error("[FriendService] Error declining request:", error);
      return false;
    }
  }

  /**
   * Get all incoming pending requests for the current user
   */
  async getIncomingRequests(uid: string): Promise<FriendRequest[]> {
    try {
      const q = query(
        collection(db, this.requestsCollection),
        where("receiverUid", "==", uid),
        where("status", "==", "pending")
      );
      const snapshot = await getDocs(q);
      const requests: FriendRequest[] = [];
      snapshot.forEach((d) => {
        requests.push(d.data() as FriendRequest);
      });
      return requests;
    } catch (error) {
      console.warn("[FriendService] Failed to load incoming requests:", error);
      return [];
    }
  }

  /**
   * Get all accepted friends for a user, enriched with their latest scores
   */
  async getFriendsList(uid: string): Promise<UserFriendProfile[]> {
    try {
      // Find all accepted requests where user is sender
      const q1 = query(
        collection(db, this.requestsCollection),
        where("senderUid", "==", uid),
        where("status", "==", "accepted")
      );

      // Find all accepted requests where user is receiver
      const q2 = query(
        collection(db, this.requestsCollection),
        where("receiverUid", "==", uid),
        where("status", "==", "accepted")
      );

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const friendUids = new Set<string>();

      snap1.forEach((d) => {
        const req = d.data() as FriendRequest;
        friendUids.add(req.receiverUid);
      });

      snap2.forEach((d) => {
        const req = d.data() as FriendRequest;
        friendUids.add(req.senderUid);
      });

      if (friendUids.size === 0) return [];

      // Fetch each friend's profile and leaderboard score
      const friendPromises = Array.from(friendUids).map(async (fUid) => {
        const [userSnap, scoreSnap] = await Promise.all([
          getDoc(doc(db, this.usersCollection, fUid)),
          getDoc(doc(db, "leaderboard", fUid)),
        ]);

        const baseProfile = userSnap.exists()
          ? (userSnap.data() as UserFriendProfile)
          : {
              uid: fUid,
              displayName: "Friend",
              friendCode: this.formatFriendCode(fUid),
            };

        const scoreData = scoreSnap.exists() ? scoreSnap.data() : null;

        return {
          ...baseProfile,
          highScore: scoreData?.score || 0,
          lines: scoreData?.lines || 0,
          level: scoreData?.level || 1,
        } as UserFriendProfile;
      });

      const friends = await Promise.all(friendPromises);
      friends.sort((a, b) => (b.highScore || 0) - (a.highScore || 0));
      return friends;
    } catch (error) {
      console.warn("[FriendService] Error fetching friends list:", error);
      return [];
    }
  }

  /**
   * Stepping Stone for Location / Relative proximity:
   * Compares current user's profile with a candidate profile.
   * Hook for future geolocation (GPS/IP/City) and contacts/relatives matching.
   */
  calculateRelationProximity(
    myProfile: UserFriendProfile | null,
    candidate: UserFriendProfile
  ): { isRelated: boolean; label: string } {
    // 1. Direct location match (e.g. same city, district or region)
    if (
      myProfile?.location &&
      candidate.location &&
      myProfile.location.trim().toLowerCase() ===
        candidate.location.trim().toLowerCase()
    ) {
      return { isRelated: true, label: `📍 Near You (${candidate.location})` };
    }

    // 2. Relatives / Family match (e.g. shared surname, family tags)
    if (myProfile?.relatives && candidate.relatives) {
      const hasShared = myProfile.relatives.some((r) =>
        candidate.relatives?.includes(r)
      );
      if (hasShared) {
        return { isRelated: true, label: "👥 Relative / Family" };
      }
    }

    // 3. Fallback: Candidate tagged as nearby
    if (
      candidate.location &&
      candidate.location.toLowerCase().includes("nearby")
    ) {
      return { isRelated: true, label: `📍 ${candidate.location}` };
    }

    return { isRelated: false, label: "" };
  }

  /**
   * Advanced Multi-Tier Recommended Friends Algorithm:
   * Composition:
   * - 50% Related / Near You (Geolocation / Relatives stepping stone)
   * - 40% Close-Score Rivals (Tight competitive skill match)
   * - 10% High-Score Aspirants (Scores several times higher to inspire mastery)
   */
  async getRecommendedFriends(
    currentUid: string,
    limitCount: number = 10
  ): Promise<RecommendedFriend[]> {
    try {
      // 1. Get current user's profile and score
      const [myProfileSnap, myScoreSnap] = await Promise.all([
        getDoc(doc(db, this.usersCollection, currentUid)),
        getDoc(doc(db, "leaderboard", currentUid)),
      ]);

      const myProfile = myProfileSnap.exists()
        ? (myProfileSnap.data() as UserFriendProfile)
        : null;

      const myScore = myScoreSnap.exists()
        ? (myScoreSnap.data()?.score as number) || 0
        : 0;

      // 2. Fetch existing friendships and pending requests to exclude
      const [sentSnap, receivedSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, this.requestsCollection),
            where("senderUid", "==", currentUid)
          )
        ),
        getDocs(
          query(
            collection(db, this.requestsCollection),
            where("receiverUid", "==", currentUid)
          )
        ),
      ]);

      const excludedUids = new Set<string>();
      excludedUids.add(currentUid);

      sentSnap.forEach((d) => {
        const data = d.data() as FriendRequest;
        excludedUids.add(data.receiverUid);
      });

      receivedSnap.forEach((d) => {
        const data = d.data() as FriendRequest;
        excludedUids.add(data.senderUid);
      });

      // 3. Fetch candidates from leaderboard
      const leaderboardSnap = await getDocs(
        query(
          collection(db, "leaderboard"),
          orderBy("score", "desc"),
          limit(60)
        )
      );

      // Separate candidates into 4 distinct pools
      const relatedPool: RecommendedFriend[] = [];
      const proPool: RecommendedFriend[] = [];
      const lowerPool: RecommendedFriend[] = [];
      const rivalPool: RecommendedFriend[] = [];

      leaderboardSnap.forEach((d) => {
        if (excludedUids.has(d.id)) return;

        const data = d.data();
        const score = (data.score as number) || 0;
        const scoreDiff = Math.abs(score - myScore);

        const base = Math.max(myScore, 1000);
        const similarityPercentage = Math.max(
          1,
          Math.min(100, Math.round(100 - (scoreDiff / base) * 60))
        );

        let scoreComparison = "Tie";
        if (score > myScore) {
          scoreComparison = `+${(score - myScore).toLocaleString()}`;
        } else if (score < myScore) {
          scoreComparison = `-${(myScore - score).toLocaleString()}`;
        }

        const candidateProfile: UserFriendProfile = {
          uid: d.id,
          displayName: data.displayName || "Player",
          friendCode: data.friendCode || this.formatFriendCode(d.id),
          highScore: score,
          lines: data.lines || 0,
          level: data.level || 1,
          location: data.location || null,
          relatives: data.relatives || null,
        };

        // Check if Related / Nearby (Stepping stone)
        const relationCheck = this.calculateRelationProximity(
          myProfile,
          candidateProfile
        );

        if (relationCheck.isRelated) {
          relatedPool.push({
            profile: candidateProfile,
            scoreDiff,
            scoreComparison,
            similarityPercentage,
            category: "related",
            badgeLabel: relationCheck.label,
            badgeType: "nearby",
          });
        } else if (score >= Math.max(myScore * 2, myScore + 3000)) {
          // Check if High Score Pro Master (>= 2x user's score)
          const multiplier = (score / Math.max(myScore, 1)).toFixed(1);
          proPool.push({
            profile: candidateProfile,
            scoreDiff,
            scoreComparison,
            similarityPercentage: Math.max(
              10,
              Math.round(100 / parseFloat(multiplier))
            ),
            category: "pro_master",
            badgeLabel: `👑 Pro Master (${multiplier}x Score)`,
            badgeType: "pro",
          });
        } else if (score < myScore - 500 && score <= myScore * 0.75) {
          // Check if Lower High Score (Apprentice / Rising player)
          lowerPool.push({
            profile: candidateProfile,
            scoreDiff,
            scoreComparison,
            similarityPercentage,
            category: "lower_tier",
            badgeLabel: `🌱 Rising Player (${scoreComparison})`,
            badgeType: "lower",
          });
        } else {
          // Standard Skill Rival
          rivalPool.push({
            profile: candidateProfile,
            scoreDiff,
            scoreComparison,
            similarityPercentage,
            category: "rival",
            badgeLabel: `⚔️ Skill Rival (${scoreComparison})`,
            badgeType: "rival",
          });
        }
      });

      // Sort pools
      relatedPool.sort((a, b) => a.scoreDiff - b.scoreDiff);
      proPool.sort(
        (a, b) => (b.profile.highScore || 0) - (a.profile.highScore || 0)
      );
      lowerPool.sort((a, b) => (b.profile.highScore || 0) - (a.profile.highScore || 0));
      rivalPool.sort((a, b) => a.scoreDiff - b.scoreDiff);

      // Target quotas:
      // - 50% Related / Near You
      // - 10% Pro Masters (Scores several times higher)
      // - 5%  Lower Tier / Rising Players (Scores lower than you)
      // - 35% Close Skill Rivals
      const targetRelated = Math.max(1, Math.round(limitCount * 0.5)); // 50%
      const targetPro = Math.max(1, Math.round(limitCount * 0.1)); // 10%
      const targetLower = Math.max(1, Math.round(limitCount * 0.05)); // 5%
      const targetRival = Math.max(
        1,
        limitCount - targetRelated - targetPro - targetLower
      ); // 35%

      const finalRecommendations: RecommendedFriend[] = [];
      const addedUids = new Set<string>();

      const addFrom = (list: RecommendedFriend[], max: number) => {
        let count = 0;
        for (const item of list) {
          if (count >= max) break;
          if (!addedUids.has(item.profile.uid)) {
            finalRecommendations.push(item);
            addedUids.add(item.profile.uid);
            count++;
          }
        }
      };

      // 1. Add 50% Related / Nearby
      addFrom(relatedPool, targetRelated);

      // 2. Add 10% Pro Masters (several times higher score)
      addFrom(proPool, targetPro);

      // 3. Add 5% Lower Score Players
      addFrom(lowerPool, targetLower);

      // 4. Add 35% Skill Rivals
      addFrom(rivalPool, targetRival);

      // 5. Backfill if any pool was short
      if (finalRecommendations.length < limitCount) {
        addFrom(rivalPool, limitCount - finalRecommendations.length);
      }
      if (finalRecommendations.length < limitCount) {
        addFrom(lowerPool, limitCount - finalRecommendations.length);
      }
      if (finalRecommendations.length < limitCount) {
        addFrom(proPool, limitCount - finalRecommendations.length);
      }
      if (finalRecommendations.length < limitCount) {
        addFrom(relatedPool, limitCount - finalRecommendations.length);
      }

      return finalRecommendations.slice(0, limitCount);
    } catch (error) {
      console.warn(
        "[FriendService] Failed to compute recommended friends:",
        error
      );
      return [];
    }
  }

  /**
   * Remove a friend
   */
  async removeFriend(currentUid: string, friendUid: string): Promise<boolean> {
    try {
      const id1 = `${currentUid}_${friendUid}`;
      const id2 = `${friendUid}_${currentUid}`;

      await Promise.all([
        deleteDoc(doc(db, this.requestsCollection, id1)).catch(() => {}),
        deleteDoc(doc(db, this.requestsCollection, id2)).catch(() => {}),
      ]);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const friendService = new FriendService();
export default function RouteFallback() {
  return null;
}
