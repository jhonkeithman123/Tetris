import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
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
          {/* Header */}
          <Text style={styles.title}>GAME PAUSED</Text>
          <View style={styles.headerUnderline} />

          {/* DITroy AI Online Status Banner */}
          <View style={[styles.aiStatusBadge, isOnline ? styles.aiOnline : styles.aiOffline]}>
            <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
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
              style={[styles.audioToggleBtn, musicEnabled && styles.audioToggleActive]}
              onPress={() => onToggleMusic(!musicEnabled)}
            >
              <Text style={styles.audioToggleText}>
                {musicEnabled ? "🎵 Music: ON" : "🔇 Music: OFF"}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.audioToggleBtn, sfxEnabled && styles.audioToggleActive]}
              onPress={() => onToggleSfx(!sfxEnabled)}
            >
              <Text style={styles.audioToggleText}>
                {sfxEnabled ? "🔊 SFX: ON" : "🔈 SFX: OFF"}
              </Text>
            </Pressable>
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
    backgroundColor: "#121324",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#3498db",
    padding: 22,
    alignItems: "center",
    shadowColor: "#00ffff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 12,
  },
  title: {
    fontSize: 24,
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
    marginBottom: 14,
  },
  aiStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
    marginBottom: 18,
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
    fontSize: 12,
    fontWeight: "700",
  },
  actionsContainer: {
    width: "100%",
    gap: 10,
  },
  button: {
    width: "100%",
    paddingVertical: 13,
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
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  restartButton: {
    backgroundColor: "#f39c12",
  },
  restartButtonText: {
    color: "#ffffff",
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
