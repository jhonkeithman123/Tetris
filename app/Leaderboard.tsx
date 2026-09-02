import AuthModal from "@/app/components/AuthModal";
import FriendsModal from "@/app/components/FriendsModal";
import authService from "@/app/services/authService";
import { friendService } from "@/app/services/friendService";
import leaderboardService, {
  LeaderboardEntry,
} from "@/app/services/leaderboardService";
import { User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface LeaderboardProps {
  onBack: () => void;
}

export default function Leaderboard({ onBack }: LeaderboardProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(
    authService.getCurrentUser()
  );
  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [authModalVisible, setAuthModalVisible] = useState<boolean>(false);
  const [friendsModalVisible, setFriendsModalVisible] =
    useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthState((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    if (activeTab === "global") {
      const data = await leaderboardService.fetchTopLeaderboard(50);
      setEntries(data);
    } else {
      if (!currentUser) {
        setEntries([]);
      } else {
        const friends = await friendService.getFriendsList(currentUser.uid);
        const uids = [currentUser.uid, ...friends.map((f) => f.uid)];
        const data = await leaderboardService.fetchFriendsLeaderboard(uids);
        setEntries(data);
      }
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab, currentUser]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const topThree = entries.slice(0, 3);
  const restEntries = entries.slice(3);

  return (
    <View style={styles.container}>
      {/* Auth Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSuccess={() => {
          setAuthModalVisible(false);
          loadLeaderboard();
        }}
      />

      {/* Friends Modal */}
      <FriendsModal
        visible={friendsModalVisible}
        onClose={() => {
          setFriendsModalVisible(false);
          if (activeTab === "friends") {
            loadLeaderboard();
          }
        }}
        onOpenAuth={() => setAuthModalVisible(true)}
      />

      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← BACK</Text>
        </Pressable>
        <Text style={styles.title}>
          {activeTab === "global" ? "GLOBAL RANKS" : "FRIENDS RANKS"}
        </Text>
        <View style={styles.headerRightButtons}>
          <Pressable
            style={styles.friendsHeaderButton}
            onPress={() => setFriendsModalVisible(true)}
          >
            <Text style={styles.friendsHeaderButtonText}>👥 Friends</Text>
          </Pressable>
          <Pressable
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={loading || refreshing}
          >
            <Text style={styles.refreshButtonText}>
              {refreshing ? "..." : "🔄"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Mode Tab Bar: Global vs Friends */}
      <View style={styles.modeTabBar}>
        <Pressable
          style={[
            styles.modeTab,
            activeTab === "global" && styles.modeTabActive,
          ]}
          onPress={() => setActiveTab("global")}
        >
          <Text
            style={[
              styles.modeTabText,
              activeTab === "global" && styles.modeTabTextActive,
            ]}
          >
            🌐 GLOBAL
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.modeTab,
            activeTab === "friends" && styles.modeTabActive,
          ]}
          onPress={() => setActiveTab("friends")}
        >
          <Text
            style={[
              styles.modeTabText,
              activeTab === "friends" && styles.modeTabTextActive,
            ]}
          >
            👥 FRIENDS
          </Text>
        </Pressable>
      </View>

      {/* Player Account Status Bar */}
      <View style={styles.accountBar}>
        {currentUser ? (
          <View style={styles.accountLoggedIn}>
            <View style={styles.statusDotOnline} />
            <Text style={styles.accountName}>
              Logged in:{" "}
              <Text style={styles.accountNameHighlight}>
                {currentUser.displayName ||
                  currentUser.email?.split("@")[0] ||
                  "Player"}
              </Text>
            </Text>
            <Text style={styles.accountNote}>
              • Cloud Leaderboard Active
            </Text>
          </View>
        ) : (
          <View style={styles.accountGuestRow}>
            <View style={styles.accountGuestLeft}>
              <View style={styles.statusDotOffline} />
              <Text style={styles.accountGuestText}>
                Guest Account (Scores saved offline only)
              </Text>
            </View>
            <Pressable
              style={styles.signInPill}
              onPress={() => setAuthModalVisible(true)}
            >
              <Text style={styles.signInPillText}>SIGN IN</Text>
            </Pressable>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading Arcade Rankings...</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.emptyTitle}>NO CLOUD SCORES YET</Text>
          <Text style={styles.emptySubtitle}>
            Be the first authenticated champion to claim #1 on the leaderboard!
          </Text>
          {!currentUser && (
            <Pressable
              style={styles.emptySignInButton}
              onPress={() => setAuthModalVisible(true)}
            >
              <Text style={styles.emptySignInButtonText}>
                SIGN IN TO COMPETE
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={restEntries}
          keyExtractor={(item) => item.uid}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            topThree.length > 0 ? (
              <View style={styles.podiumContainer}>
                {/* 2nd Place */}
                {topThree[1] && (
                  <View style={[styles.podiumColumn, styles.silverColumn]}>
                    <Text style={styles.medalIcon}>🥈</Text>
                    <Text style={styles.podiumRank}>#2</Text>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {topThree[1].displayName}
                    </Text>
                    <Text style={styles.podiumScore}>
                      {topThree[1].score.toLocaleString()}
                    </Text>
                    <Text style={styles.podiumSub}>
                      Lvl {topThree[1].level} • {topThree[1].lines}L
                    </Text>
                  </View>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <View style={[styles.podiumColumn, styles.goldColumn]}>
                    <Text style={styles.crownIcon}>👑</Text>
                    <Text style={styles.goldMedalIcon}>🥇</Text>
                    <Text style={[styles.podiumRank, styles.goldRank]}>#1</Text>
                    <Text style={[styles.podiumName, styles.goldName]} numberOfLines={1}>
                      {topThree[0].displayName}
                    </Text>
                    <Text style={[styles.podiumScore, styles.goldScore]}>
                      {topThree[0].score.toLocaleString()}
                    </Text>
                    <Text style={styles.podiumSub}>
                      Lvl {topThree[0].level} • {topThree[0].lines}L
                    </Text>
                  </View>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <View style={[styles.podiumColumn, styles.bronzeColumn]}>
                    <Text style={styles.medalIcon}>🥉</Text>
                    <Text style={styles.podiumRank}>#3</Text>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {topThree[2].displayName}
                    </Text>
                    <Text style={styles.podiumScore}>
                      {topThree[2].score.toLocaleString()}
                    </Text>
                    <Text style={styles.podiumSub}>
                      Lvl {topThree[2].level} • {topThree[2].lines}L
                    </Text>
                  </View>
                )}
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isMe = currentUser?.uid === item.uid;
            return (
              <View style={[styles.rankRow, isMe && styles.rankRowMe]}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNumber}>#{item.rank}</Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={[styles.playerName, isMe && styles.playerNameMe]}>
                    {item.displayName} {isMe && "(YOU)"}
                  </Text>
                  <Text style={styles.playerStats}>
                    Level {item.level} • {item.lines} lines
                  </Text>
                </View>
                <Text style={[styles.playerScore, isMe && styles.playerScoreMe]}>
                  {item.score.toLocaleString()}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0b",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3498db",
  },
  backButtonText: {
    color: "#3498db",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 2,
  },
  refreshButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2c3e50",
  },
  refreshButtonText: {
    fontSize: 16,
    color: "#3498db",
  },
  headerRightButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  friendsHeaderButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#16162a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3498db",
  },
  friendsHeaderButtonText: {
    color: "#3498db",
    fontSize: 12,
    fontWeight: "bold",
  },
  modeTabBar: {
    flexDirection: "row",
    backgroundColor: "#12121f",
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#20203a",
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  modeTabActive: {
    backgroundColor: "#3498db",
  },
  modeTabText: {
    color: "#7f8c8d",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  modeTabTextActive: {
    color: "#ffffff",
  },
  accountBar: {
    backgroundColor: "#141424",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#26263f",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  accountLoggedIn: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDotOnline: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2ecc71",
    marginRight: 8,
  },
  statusDotOffline: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f39c12",
    marginRight: 8,
  },
  accountName: {
    color: "#bdc3c7",
    fontSize: 12,
  },
  accountNameHighlight: {
    color: "#3498db",
    fontWeight: "bold",
  },
  accountNote: {
    color: "#2ecc71",
    fontSize: 11,
    marginLeft: 6,
  },
  accountGuestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accountGuestLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  accountGuestText: {
    color: "#f39c12",
    fontSize: 11,
    fontWeight: "600",
  },
  signInPill: {
    backgroundColor: "#3498db",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  signInPillText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  loadingText: {
    color: "#7f8c8d",
    fontSize: 13,
    marginTop: 12,
    letterSpacing: 1,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f1c40f",
    letterSpacing: 2,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  emptySignInButton: {
    backgroundColor: "#3498db",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptySignInButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  podiumContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    marginBottom: 20,
    gap: 10,
    paddingTop: 14,
  },
  podiumColumn: {
    backgroundColor: "#16162a",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    width: "30%",
    borderWidth: 1.5,
  },
  goldColumn: {
    borderColor: "#f1c40f",
    backgroundColor: "#1e1a2f",
    paddingVertical: 14,
    transform: [{ translateY: -10 }],
    shadowColor: "#f1c40f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  silverColumn: {
    borderColor: "#bdc3c7",
  },
  bronzeColumn: {
    borderColor: "#e67e22",
  },
  crownIcon: {
    fontSize: 18,
    marginBottom: -4,
  },
  medalIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  goldMedalIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  podiumRank: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#7f8c8d",
    marginBottom: 2,
  },
  goldRank: {
    color: "#f1c40f",
    fontSize: 14,
  },
  podiumName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
    textAlign: "center",
  },
  goldName: {
    color: "#f1c40f",
    fontSize: 13,
  },
  podiumScore: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#3498db",
  },
  goldScore: {
    fontSize: 15,
    color: "#f1c40f",
  },
  podiumSub: {
    fontSize: 9,
    color: "#7f8c8d",
    marginTop: 2,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141424",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#20203a",
  },
  rankRowMe: {
    borderColor: "#3498db",
    backgroundColor: "rgba(52, 152, 219, 0.15)",
  },
  rankBadge: {
    width: 38,
    alignItems: "center",
  },
  rankNumber: {
    color: "#8e9aaf",
    fontSize: 13,
    fontWeight: "bold",
  },
  playerInfo: {
    flex: 1,
    paddingHorizontal: 10,
  },
  playerName: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
  playerNameMe: {
    color: "#3498db",
  },
  playerStats: {
    color: "#7f8c8d",
    fontSize: 10,
    marginTop: 2,
  },
  playerScore: {
    color: "#3498db",
    fontSize: 15,
    fontWeight: "bold",
  },
  playerScoreMe: {
    color: "#f1c40f",
  },
});
