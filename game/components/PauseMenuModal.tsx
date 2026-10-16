import {
  ALL_JUKEBOX_TRACKS,
  casualMusicService,
  JukeboxState,
  YTMusicTrack,
} from "@/app/services/casualMusicService";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface PauseMenuModalProps {
  visible: boolean;
  score: number;
  level: number;
  lines: number;
  isOnline: boolean;
  difficultyTier: string;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  onToggleMusic: (enabled: boolean) => void;
  onToggleSfx: (enabled: boolean) => void;
  onResume: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
}

export default function PauseMenuModal({
  visible,
  score,
  level,
  lines,
  isOnline,
  difficultyTier,
  musicEnabled,
  sfxEnabled,
  onToggleMusic,
  onToggleSfx,
  onResume,
  onRestart,
  onQuitToMenu,
}: PauseMenuModalProps) {
  const [jukeboxState, setJukeboxState] = useState<JukeboxState>(
    casualMusicService.getState()
  );
  const [ytSearchOpen, setYtSearchOpen] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const [ytResults, setYtResults] = useState<YTMusicTrack[]>([]);

  useEffect(() => {
    const unsub = casualMusicService.subscribe(setJukeboxState);
    return () => unsub();
  }, []);

  const handleSelectStation = async (id: string) => {
    await casualMusicService.setStation(id);
  };

  const handleSearchYT = async () => {
    if (!ytQuery.trim()) return;
    setYtLoading(true);
    const tracks = await casualMusicService.searchYTMusic(ytQuery);
    setYtResults(tracks);
    setYtLoading(false);
  };

  const handlePlayYTTrack = async (track: YTMusicTrack) => {
    await casualMusicService.playYTMusicTrack(track);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onResume}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <Text style={styles.title}>GAME PAUSED</Text>
            <View style={styles.headerUnderline} />

            {/* DITroy AI Online Status Banner */}
            <View
              style={[
                styles.aiStatusBadge,
                isOnline ? styles.aiOnline : styles.aiOffline,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  isOnline ? styles.dotOnline : styles.dotOffline,
                ]}
              />
              <Text style={styles.aiStatusText}>
                {isOnline
                  ? `DITroy AI Online • ${difficultyTier.toUpperCase()} TIMING`
                  : "Standard Mode • Offline"}
              </Text>
            </View>

            {/* Live Game Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>SCORE</Text>
                <Text style={styles.statValue}>{score.toLocaleString()}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>LEVEL</Text>
                <Text style={styles.statValue}>{level}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>LINES</Text>
                <Text style={styles.statValue}>{lines}</Text>
              </View>
            </View>

            {/* Audio Quick Toggles */}
            <View style={styles.audioTogglesRow}>
              <Pressable
                style={[
                  styles.audioToggleBtn,
                  musicEnabled && styles.audioToggleActive,
                ]}
                onPress={() => {
                  const next = !musicEnabled;
                  onToggleMusic(next);
                  casualMusicService.setVolume(next ? 0.5 : 0);
                }}
              >
                <Text style={styles.audioToggleText}>
                  {musicEnabled ? "🎵 Audio: ON" : "🔇 Audio: OFF"}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.audioToggleBtn,
                  sfxEnabled && styles.audioToggleActive,
                ]}
                onPress={() => onToggleSfx(!sfxEnabled)}
              >
                <Text style={styles.audioToggleText}>
                  {sfxEnabled ? "🔊 SFX: ON" : "🔈 SFX: OFF"}
                </Text>
              </Pressable>
            </View>

            {/* Casual Chill Jukebox Section */}
            <View style={styles.jukeboxSection}>
              <View style={styles.jukeboxHeaderRow}>
                <Text style={styles.jukeboxTitle}>📻 CASUAL JUKEBOX</Text>
                <Pressable
                  style={styles.ytSearchToggle}
                  onPress={() => setYtSearchOpen(!ytSearchOpen)}
                >
                  <Text style={styles.ytSearchToggleText}>
                    {ytSearchOpen ? "✕ Close" : "🔍 YT Music"}
                  </Text>
                </Pressable>
              </View>

              {/* Station Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.stationsScroll}
                contentContainerStyle={styles.stationsContent}
              >
                {ALL_JUKEBOX_TRACKS.map((st) => {
                  const isSelected =
                    jukeboxState.currentStationId === st.id;
                  return (
                    <Pressable
                      key={st.id}
                      style={[
                        styles.stationChip,
                        isSelected && styles.stationChipActive,
                      ]}
                      onPress={() => handleSelectStation(st.id)}
                    >
                      <Text style={styles.stationIcon}>{st.icon}</Text>
                      <Text
                        style={[
                          styles.stationText,
                          isSelected && styles.stationTextActive,
                        ]}
                      >
                        {st.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* YouTube Music Search Box */}
              {ytSearchOpen && (
                <View style={styles.ytSearchContainer}>
                  <View style={styles.ytSearchRow}>
                    <TextInput
                      style={styles.ytSearchInput}
                      placeholder="Search songs on YT Music..."
                      placeholderTextColor="#7f8c8d"
                      value={ytQuery}
                      onChangeText={setYtQuery}
                      autoCapitalize="none"
                    />
                    <Pressable
                      style={styles.ytSearchBtn}
                      onPress={handleSearchYT}
                    >
                      <Text style={styles.ytSearchBtnText}>Search</Text>
                    </Pressable>
                  </View>

                  {ytLoading && (
                    <ActivityIndicator
                      size="small"
                      color="#00e676"
                      style={{ marginVertical: 8 }}
                    />
                  )}

                  {ytResults.length > 0 && (
                    <View style={styles.ytResultsList}>
                      {ytResults.map((tr) => (
                        <Pressable
                          key={tr.id}
                          style={styles.ytResultItem}
                          onPress={() => handlePlayYTTrack(tr)}
                        >
                          <Text style={styles.ytResultPlayIcon}>▶</Text>
                          <View style={styles.ytResultInfo}>
                            <Text
                              style={styles.ytResultTitle}
                              numberOfLines={1}
                            >
                              {tr.title}
                            </Text>
                            <Text
                              style={styles.ytResultArtist}
                              numberOfLines={1}
                            >
                              {tr.uploaderName}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Now Playing Banner */}
              <View style={styles.nowPlayingCard}>
                <View style={styles.nowPlayingInfo}>
                  <Text style={styles.nowPlayingLabel}>NOW STREAMING</Text>
                  <Text style={styles.nowPlayingTitle} numberOfLines={1}>
                    {jukeboxState.isLoading
                      ? "Buffering stream..."
                      : jukeboxState.activeTrackTitle}
                  </Text>
                  <Text style={styles.nowPlayingArtist} numberOfLines={1}>
                    {jukeboxState.activeTrackArtist}
                  </Text>
                </View>
                <Pressable
                  style={styles.playPauseBtn}
                  onPress={() => casualMusicService.togglePlay()}
                >
                  <Text style={styles.playPauseBtnText}>
                    {jukeboxState.isPlaying ? "⏸" : "▶"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.resumeButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={onResume}
              >
                <Text style={styles.resumeButtonText}>▶ RESUME GAME</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.restartButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={onRestart}
              >
                <Text style={styles.restartButtonText}>🔄 RESTART</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.quitButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={onQuitToMenu}
              >
                <Text style={styles.quitButtonText}>🚪 QUIT TO MENU</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    maxHeight: "88%",
    backgroundColor: "#121324",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#3498db",
    padding: 18,
    shadowColor: "#00ffff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 12,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 3,
    textAlign: "center",
  },
  headerUnderline: {
    width: 60,
    height: 3,
    backgroundColor: "#00ffff",
    borderRadius: 2,
    marginTop: 6,
    marginBottom: 12,
  },
  aiStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  aiOnline: {
    backgroundColor: "rgba(46, 204, 113, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(46, 204, 113, 0.4)",
  },
  aiOffline: {
    backgroundColor: "rgba(149, 165, 166, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(149, 165, 166, 0.3)",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  dotOnline: {
    backgroundColor: "#2ecc71",
  },
  dotOffline: {
    backgroundColor: "#95a5a6",
  },
  aiStatusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ecf0f1",
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#1a1b35",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2d52",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#2a2d52",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#7f8c8d",
    letterSpacing: 1,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#00ffff",
  },
  audioTogglesRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginBottom: 12,
  },
  audioToggleBtn: {
    flex: 1,
    backgroundColor: "#1c1d38",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2c2e55",
  },
  audioToggleActive: {
    borderColor: "#3498db",
    backgroundColor: "#202449",
  },
  audioToggleText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  jukeboxSection: {
    width: "100%",
    backgroundColor: "#171936",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2c3066",
  },
  jukeboxHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  jukeboxTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#f39c12",
    letterSpacing: 1,
  },
  ytSearchToggle: {
    backgroundColor: "#2c3066",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ytSearchToggleText: {
    color: "#00ffff",
    fontSize: 10,
    fontWeight: "800",
  },
  stationsScroll: {
    marginBottom: 8,
  },
  stationsContent: {
    gap: 6,
    paddingVertical: 2,
  },
  stationChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#11122a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2a2c5a",
    gap: 5,
  },
  stationChipActive: {
    backgroundColor: "#24335c",
    borderColor: "#00ffff",
  },
  stationIcon: {
    fontSize: 12,
  },
  stationText: {
    color: "#8892b0",
    fontSize: 11,
    fontWeight: "700",
  },
  stationTextActive: {
    color: "#ffffff",
  },
  ytSearchContainer: {
    marginBottom: 10,
    backgroundColor: "#0d0e22",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#1f224b",
  },
  ytSearchRow: {
    flexDirection: "row",
    gap: 6,
  },
  ytSearchInput: {
    flex: 1,
    backgroundColor: "#191b3e",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    color: "#ffffff",
    fontSize: 11,
  },
  ytSearchBtn: {
    backgroundColor: "#00e676",
    paddingHorizontal: 10,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  ytSearchBtnText: {
    color: "#0a1910",
    fontWeight: "800",
    fontSize: 11,
  },
  ytResultsList: {
    marginTop: 6,
    gap: 4,
    maxHeight: 120,
  },
  ytResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#151737",
    gap: 8,
  },
  ytResultPlayIcon: {
    color: "#00ffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  ytResultInfo: {
    flex: 1,
  },
  ytResultTitle: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  ytResultArtist: {
    color: "#8892b0",
    fontSize: 9,
  },
  nowPlayingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#101228",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#212450",
  },
  nowPlayingInfo: {
    flex: 1,
    marginRight: 8,
  },
  nowPlayingLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#00e676",
    letterSpacing: 1,
    marginBottom: 1,
  },
  nowPlayingTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff",
  },
  nowPlayingArtist: {
    fontSize: 9,
    color: "#7f8c8d",
    marginTop: 1,
  },
  playPauseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
  },
  playPauseBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  actionsContainer: {
    width: "100%",
    gap: 8,
  },
  button: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  resumeButton: {
    backgroundColor: "#00e676",
    shadowColor: "#00e676",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  resumeButtonText: {
    color: "#0a1910",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  restartButton: {
    backgroundColor: "#f39c12",
  },
  restartButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  quitButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#e74c3c",
  },
  quitButtonText: {
    color: "#e74c3c",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
