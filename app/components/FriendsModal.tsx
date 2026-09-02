import authService from "@/app/services/authService";
import {
  FriendRequest,
  friendService,
  RecommendedFriend,
  UserFriendProfile,
} from "@/app/services/friendService";
import { User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Clipboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface FriendsModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

type TabType = "friends" | "add" | "requests";

export default function FriendsModal({
  visible,
  onClose,
  onOpenAuth,
}: FriendsModalProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(
    authService.getCurrentUser()
  );
  const [currentTab, setCurrentTab] = useState<TabType>("friends");

  const [myProfile, setMyProfile] = useState<UserFriendProfile | null>(null);
  const [friendsList, setFriendsList] = useState<UserFriendProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [recommendedFriends, setRecommendedFriends] = useState<
    RecommendedFriend[]
  >([]);
  const [sentRequestMap, setSentRequestMap] = useState<Record<string, boolean>>(
    {}
  );
  const [loading, setLoading] = useState<boolean>(false);

  // Search state
  const [searchCode, setSearchCode] = useState<string>("");
  const [searchResult, setSearchResult] =
    useState<UserFriendProfile | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  useEffect(() => {
    const unsub = authService.subscribeToAuthState((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const loadFriendData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [profile, friends, requests, recommended] = await Promise.all([
        friendService.ensureUserProfile(currentUser.uid),
        friendService.getFriendsList(currentUser.uid),
        friendService.getIncomingRequests(currentUser.uid),
        friendService.getRecommendedFriends(currentUser.uid, 6),
      ]);
      setMyProfile(profile);
      setFriendsList(friends);
      setPendingRequests(requests);
      setRecommendedFriends(recommended);
    } catch (e) {
      console.warn("Failed to load friend data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && currentUser) {
      loadFriendData();
    }
  }, [visible, currentUser]);

  const handleCopyCode = () => {
    if (myProfile?.friendCode) {
      Clipboard.setString(myProfile.friendCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSearch = async () => {
    setSearchError(null);
    setSearchResult(null);
    setRequestSent(false);

    if (!searchCode.trim()) {
      setSearchError("Please enter a friend code (e.g. TR-A9B42C).");
      return;
    }

    setLoading(true);
    const result = await friendService.searchByFriendCode(searchCode);
    setLoading(false);

    if (!result) {
      setSearchError("No player found with this friend code.");
    } else if (result.uid === currentUser?.uid) {
      setSearchError("That's your own friend code!");
    } else {
      setSearchResult(result);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;
    setLoading(true);
    const success = await friendService.sendFriendRequest(searchResult);
    setLoading(false);

    if (success) {
      setRequestSent(true);
    } else {
      setSearchError("Failed to send request. Check your connection.");
    }
  };

  const handleAccept = async (req: FriendRequest) => {
    await friendService.acceptFriendRequest(req);
    loadFriendData();
  };

  const handleDecline = async (requestId: string) => {
    await friendService.declineFriendRequest(requestId);
    loadFriendData();
  };

  const handleRemoveFriend = async (friendUid: string) => {
    if (!currentUser) return;
    await friendService.removeFriend(currentUser.uid, friendUid);
    loadFriendData();
  };

  const handleAddRecommended = async (target: UserFriendProfile) => {
    const success = await friendService.sendFriendRequest(target);
    if (success) {
      setSentRequestMap((prev) => ({ ...prev, [target.uid]: true }));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>FRIEND SYSTEM</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {!currentUser ? (
            <View style={styles.guestContainer}>
              <Text style={styles.guestIcon}>👥</Text>
              <Text style={styles.guestTitle}>SIGN IN REQUIRED</Text>
              <Text style={styles.guestSubtitle}>
                Sign in to get your custom Friend Code, add friends, and compete on the Friends Leaderboard!
              </Text>
              <Pressable
                style={styles.signInButton}
                onPress={() => {
                  onClose();
                  onOpenAuth();
                }}
              >
                <Text style={styles.signInButtonText}>SIGN IN / REGISTER</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Tab Bar */}
              <View style={styles.tabBar}>
                <Pressable
                  style={[
                    styles.tab,
                    currentTab === "friends" && styles.activeTab,
                  ]}
                  onPress={() => setCurrentTab("friends")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      currentTab === "friends" && styles.activeTabText,
                    ]}
                  >
                    FRIENDS ({friendsList.length})
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.tab, currentTab === "add" && styles.activeTab]}
                  onPress={() => setCurrentTab("add")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      currentTab === "add" && styles.activeTabText,
                    ]}
                  >
                    ADD FRIEND
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.tab,
                    currentTab === "requests" && styles.activeTab,
                  ]}
                  onPress={() => setCurrentTab("requests")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      currentTab === "requests" && styles.activeTabText,
                    ]}
                  >
                    REQUESTS
                    {pendingRequests.length > 0 && ` (${pendingRequests.length})`}
                  </Text>
                </Pressable>
              </View>

              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#3498db" />
                </View>
              )}

              {/* Tab: My Friends */}
              {currentTab === "friends" && (
                <ScrollView
                  style={styles.scrollArea}
                  showsVerticalScrollIndicator={false}
                >
                  {friendsList.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyIcon}>🎮</Text>
                      <Text style={styles.emptyTitle}>NO FRIENDS ADDED YET</Text>
                      <Text style={styles.emptySubtitle}>
                        Share your Friend Code with others or search for friends in the "ADD FRIEND" tab.
                      </Text>
                    </View>
                  ) : (
                    friendsList.map((friend, index) => (
                      <View key={friend.uid} style={styles.friendCard}>
                        <View style={styles.rankBadge}>
                          <Text style={styles.rankBadgeText}>#{index + 1}</Text>
                        </View>
                        <View style={styles.friendInfo}>
                          <Text style={styles.friendName}>
                            {friend.displayName}
                          </Text>
                          <Text style={styles.friendCodeSmall}>
                            {friend.friendCode}
                          </Text>
                          <Text style={styles.friendStats}>
                            Best: {friend.highScore?.toLocaleString() || 0} pts • Lvl {friend.level || 1}
                          </Text>
                        </View>
                        <Pressable
                          style={styles.removeButton}
                          onPress={() => handleRemoveFriend(friend.uid)}
                        >
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </Pressable>
                      </View>
                    ))
                  )}
                </ScrollView>
              )}

              {/* Tab: Add Friend */}
              {currentTab === "add" && (
                <ScrollView
                  style={styles.scrollArea}
                  showsVerticalScrollIndicator={false}
                >
                  {/* My Friend Code Box */}
                  <View style={styles.codeCard}>
                    <Text style={styles.codeCardLabel}>YOUR FRIEND CODE</Text>
                    <View style={styles.codeRow}>
                      <Text style={styles.codeValue}>
                        {myProfile?.friendCode || "Generating..."}
                      </Text>
                      <Pressable
                        style={[
                          styles.copyButton,
                          copiedCode && styles.copiedButton,
                        ]}
                        onPress={handleCopyCode}
                      >
                        <Text style={styles.copyButtonText}>
                          {copiedCode ? "COPIED! ✓" : "COPY"}
                        </Text>
                      </Pressable>
                    </View>
                    <Text style={styles.codeCardHint}>
                      Share this code with other players so they can add you.
                    </Text>
                  </View>

                  {/* Search Input */}
                  <View style={styles.searchSection}>
                    <Text style={styles.searchLabel}>SEARCH BY FRIEND CODE</Text>
                    <View style={styles.searchRow}>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="e.g. TR-84B91F"
                        placeholderTextColor="#666"
                        value={searchCode}
                        onChangeText={setSearchCode}
                        autoCapitalize="characters"
                      />
                      <Pressable style={styles.searchBtn} onPress={handleSearch}>
                        <Text style={styles.searchBtnText}>SEARCH</Text>
                      </Pressable>
                    </View>

                    {searchError && (
                      <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{searchError}</Text>
                      </View>
                    )}

                    {searchResult && (
                      <View style={styles.resultCard}>
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultName}>
                            {searchResult.displayName}
                          </Text>
                          <Text style={styles.resultCode}>
                            {searchResult.friendCode}
                          </Text>
                        </View>

                        {requestSent ? (
                          <View style={styles.sentBadge}>
                            <Text style={styles.sentBadgeText}>REQUEST SENT ✓</Text>
                          </View>
                        ) : (
                          <Pressable
                            style={styles.sendRequestBtn}
                            onPress={handleSendRequest}
                          >
                            <Text style={styles.sendRequestBtnText}>
                              SEND REQUEST
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Recommended Rivals Section */}
                  <View style={styles.recommendedSection}>
                    <View style={styles.recommendedHeader}>
                      <Text style={styles.recommendedTitle}>
                        🎯 RECOMMENDED RIVALS
                      </Text>
                      <Text style={styles.recommendedSubtitle}>
                        Players with high scores close to yours
                      </Text>
                    </View>

                    {recommendedFriends.length === 0 ? (
                      <Text style={styles.noRecommendedText}>
                        No rivals found nearby yet.
                      </Text>
                    ) : (
                      recommendedFriends.map((rec) => {
                        const isSent = sentRequestMap[rec.profile.uid];
                        return (
                          <View
                            key={rec.profile.uid}
                            style={styles.recommendedCard}
                          >
                            <View style={styles.recInfo}>
                              <View style={styles.recNameRow}>
                                <Text style={styles.recName}>
                                  {rec.profile.displayName}
                                </Text>
                                <View
                                  style={[
                                    styles.matchBadge,
                                    rec.badgeType === "nearby" &&
                                      styles.badgeNearby,
                                    rec.badgeType === "pro" && styles.badgePro,
                                    rec.badgeType === "lower" &&
                                      styles.badgeLower,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.matchBadgeText,
                                      rec.badgeType === "nearby" &&
                                        styles.badgeTextNearby,
                                      rec.badgeType === "pro" &&
                                        styles.badgeTextPro,
                                      rec.badgeType === "lower" &&
                                        styles.badgeTextLower,
                                    ]}
                                  >
                                    {rec.badgeLabel}
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.recStats}>
                                Score: {rec.profile.highScore?.toLocaleString() || 0}{" "}
                                • Lvl {rec.profile.level || 1} • {rec.profile.lines || 0}L
                              </Text>
                              <Text style={styles.recCode}>
                                {rec.profile.friendCode}
                              </Text>
                            </View>

                            {isSent ? (
                              <View style={styles.sentBadgeSmall}>
                                <Text style={styles.sentBadgeSmallText}>
                                  SENT ✓
                                </Text>
                              </View>
                            ) : (
                              <Pressable
                                style={styles.addRecBtn}
                                onPress={() => handleAddRecommended(rec.profile)}
                              >
                                <Text style={styles.addRecBtnText}>+ ADD</Text>
                              </Pressable>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>
                </ScrollView>
              )}

              {/* Tab: Requests */}
              {currentTab === "requests" && (
                <ScrollView
                  style={styles.scrollArea}
                  showsVerticalScrollIndicator={false}
                >
                  {pendingRequests.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyIcon}>📬</Text>
                      <Text style={styles.emptyTitle}>NO PENDING REQUESTS</Text>
                      <Text style={styles.emptySubtitle}>
                        When other players add your Friend Code, their requests will show up here.
                      </Text>
                    </View>
                  ) : (
                    pendingRequests.map((req) => (
                      <View key={req.id} style={styles.requestCard}>
                        <View style={styles.requestInfo}>
                          <Text style={styles.requestSender}>
                            {req.senderName}
                          </Text>
                          <Text style={styles.requestCode}>
                            {req.senderCode}
                          </Text>
                        </View>
                        <View style={styles.requestActions}>
                          <Pressable
                            style={styles.acceptButton}
                            onPress={() => handleAccept(req)}
                          >
                            <Text style={styles.acceptButtonText}>ACCEPT</Text>
                          </Pressable>
                          <Pressable
                            style={styles.declineButton}
                            onPress={() => handleDecline(req.id)}
                          >
                            <Text style={styles.declineButtonText}>✕</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  content: {
    backgroundColor: "#12121e",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#3498db",
    width: "100%",
    maxWidth: 440,
    maxHeight: "85%",
    padding: 20,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3498db",
    letterSpacing: 2,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    color: "#8e9aaf",
    fontSize: 20,
    fontWeight: "bold",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#0d0d17",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#20203a",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "#3498db",
  },
  tabText: {
    color: "#7f8c8d",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: "#ffffff",
  },
  scrollArea: {
    maxHeight: 380,
  },
  loadingContainer: {
    paddingVertical: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    color: "#f1c40f",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: "#7f8c8d",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16162a",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#20203a",
  },
  rankBadge: {
    width: 28,
    alignItems: "center",
  },
  rankBadgeText: {
    color: "#3498db",
    fontSize: 12,
    fontWeight: "bold",
  },
  friendInfo: {
    flex: 1,
    paddingHorizontal: 8,
  },
  friendName: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
  friendCodeSmall: {
    color: "#7f8c8d",
    fontSize: 10,
    marginTop: 1,
  },
  friendStats: {
    color: "#2ecc71",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(231, 76, 60, 0.15)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e74c3c",
  },
  removeButtonText: {
    color: "#e74c3c",
    fontSize: 10,
    fontWeight: "bold",
  },
  codeCard: {
    backgroundColor: "#16162a",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3498db",
  },
  codeCardLabel: {
    color: "#3498db",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 8,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeValue: {
    color: "#f1c40f",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  copyButton: {
    backgroundColor: "#3498db",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  copiedButton: {
    backgroundColor: "#2ecc71",
  },
  copyButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  codeCardHint: {
    color: "#7f8c8d",
    fontSize: 11,
    marginTop: 8,
  },
  searchSection: {
    marginTop: 4,
  },
  searchLabel: {
    color: "#8e9aaf",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 6,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#2c3e50",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#ffffff",
    fontSize: 13,
  },
  searchBtn: {
    backgroundColor: "#3498db",
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  errorBox: {
    backgroundColor: "rgba(231, 76, 60, 0.2)",
    borderWidth: 1,
    borderColor: "#e74c3c",
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 11,
    textAlign: "center",
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a2e",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2ecc71",
    marginTop: 4,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
  resultCode: {
    color: "#f1c40f",
    fontSize: 11,
    marginTop: 2,
  },
  sendRequestBtn: {
    backgroundColor: "#2ecc71",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  sendRequestBtnText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  sentBadge: {
    backgroundColor: "rgba(46, 204, 113, 0.2)",
    borderWidth: 1,
    borderColor: "#2ecc71",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  sentBadgeText: {
    color: "#2ecc71",
    fontSize: 10,
    fontWeight: "bold",
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#16162a",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#20203a",
  },
  requestInfo: {
    flex: 1,
  },
  requestSender: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
  requestCode: {
    color: "#f1c40f",
    fontSize: 11,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: "row",
    gap: 6,
  },
  acceptButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  declineButton: {
    backgroundColor: "rgba(231, 76, 60, 0.2)",
    borderWidth: 1,
    borderColor: "#e74c3c",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  declineButtonText: {
    color: "#e74c3c",
    fontSize: 12,
    fontWeight: "bold",
  },
  guestContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  guestIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  guestTitle: {
    color: "#f39c12",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 8,
  },
  guestSubtitle: {
    color: "#8e9aaf",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  signInButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  signInButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  recommendedSection: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#1e1e38",
    paddingTop: 14,
  },
  recommendedHeader: {
    marginBottom: 10,
  },
  recommendedTitle: {
    color: "#f1c40f",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  recommendedSubtitle: {
    color: "#7f8c8d",
    fontSize: 11,
    marginTop: 2,
  },
  noRecommendedText: {
    color: "#7f8c8d",
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 14,
  },
  recommendedCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#151528",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#252542",
  },
  recInfo: {
    flex: 1,
    paddingRight: 8,
  },
  recNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  recName: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
  matchBadge: {
    backgroundColor: "rgba(52, 152, 219, 0.2)",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#3498db",
  },
  matchBadgeText: {
    color: "#3498db",
    fontSize: 9,
    fontWeight: "bold",
  },
  badgeNearby: {
    backgroundColor: "rgba(155, 89, 182, 0.2)",
    borderColor: "#9b59b6",
  },
  badgeTextNearby: {
    color: "#bb86fc",
  },
  badgePro: {
    backgroundColor: "rgba(241, 196, 15, 0.2)",
    borderColor: "#f1c40f",
  },
  badgeTextPro: {
    color: "#f1c40f",
  },
  badgeLower: {
    backgroundColor: "rgba(46, 204, 113, 0.2)",
    borderColor: "#2ecc71",
  },
  badgeTextLower: {
    color: "#2ecc71",
  },
  recStats: {
    color: "#2ecc71",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  recCode: {
    color: "#7f8c8d",
    fontSize: 10,
    marginTop: 1,
  },
  addRecBtn: {
    backgroundColor: "#3498db",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addRecBtnText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  sentBadgeSmall: {
    backgroundColor: "rgba(46, 204, 113, 0.2)",
    borderWidth: 1,
    borderColor: "#2ecc71",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  sentBadgeSmallText: {
    color: "#2ecc71",
    fontSize: 10,
    fontWeight: "bold",
  },
});
