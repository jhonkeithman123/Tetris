import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DialogBox from "./Dialog";

// GitHub configuration
const GITHUB_OWNER = "jhonkeithman123";
const GITHUB_REPO = "Tetris";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
const CURRENT_VERSION = "1.0.0"; // TODO: UPDATE MANUALLY

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
}

const BurgerMenu = ({
  onExit,
  onHelp,
  onAccount,
}: {
  onExit: () => void;
  onHelp: () => void;
  onAccount: () => void;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [updateDialogVisible, setUpdateDialogVisible] =
    useState<boolean>(false);
  const [upToDateDialogVisible, setUpToDateDialogVisible] =
    useState<boolean>(false);
  const [updateCheckingVisible, setUpdateCheckingVisible] =
    useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<GitHubRelease | null>(null);
  const slideAnim = useRef(new Animated.Value(-250)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -250,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }).start();
  }, [isOpen]);

  const compareVersions = (latest: string, current: string): boolean => {
    const latestClean = latest.replace(/^v/, "");
    const currentClean = current.replace(/^v/, "");

    const latestParts = latestClean.split(".").map(Number);
    const currentParts = currentClean.split(".").map(Number);

    for (
      let i = 0;
      i < Math.max(latestParts.length, currentParts.length);
      i++
    ) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }

    return false;
  };

  const checkForUpdates = async () => {
    setUpdateCheckingVisible(true);
    try {
      const response = await fetch(GITHUB_API_URL);
      const data: GitHubRelease = await response.json();

      if (compareVersions(data.tag_name, CURRENT_VERSION)) {
        setUpdateInfo(data);
        setUpdateDialogVisible(true);
      } else {
        setUpToDateDialogVisible(true);
      }
      setUpdateCheckingVisible(false);
    } catch (error) {
      console.error("Error checking for updates:", error);
      setUpdateCheckingVisible(false);
    }
  };

  const handleUpdatePress = () => {
    if (updateInfo) {
      Linking.openURL(updateInfo.html_url);
    }
  };

  return (
    <>
      {/* Burger Button */}
      <Pressable style={styles.burgerButton} onPress={() => setIsOpen(!isOpen)}>
        <View style={styles.burgerLine} />
        <View style={styles.burgerLine} />
        <View style={styles.burgerLine} />
      </Pressable>

      {/* Overlay */}
      {isOpen && (
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)} />
      )}

      {/* Update Checking Dialog */}
      {updateCheckingVisible && (
        <View style={styles.updateCheckingOverlay}>
          <View style={styles.updateCheckingBox}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.updateCheckingText}>
              Checking for updates...
            </Text>
          </View>
        </View>
      )}

      {/* Update Available Dialog */}
      <DialogBox
        visible={updateDialogVisible && !!updateInfo}
        title="Update Available"
        message={`Version ${updateInfo?.tag_name || ""} is available!\n\n${
          updateInfo?.body || ""
        }`}
        type="confirm"
        confirmText="Update Now"
        cancelText="Later"
        onConfirm={handleUpdatePress}
        onCancel={() => setUpdateDialogVisible(false)}
      />

      {/* Up to Date Dialog */}
      <DialogBox
        visible={upToDateDialogVisible}
        title="Up to Date"
        message={`You're running the latest (${CURRENT_VERSION})!\n\nNo updates available at this time.`}
        type="alert"
        onConfirm={() => setUpToDateDialogVisible(false)}
      />

      {/* Side Menu */}
      <Animated.View
        style={[styles.sideMenu, { transform: [{ translateX: slideAnim }] }]}
      >
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Menu</Text>
          <Pressable onPress={() => setIsOpen(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.menuItem}
          onPress={() => {
            setIsOpen(false);
            onAccount();
          }}
        >
          <Text style={styles.menuItemText}>👤 Account</Text>
        </Pressable>

        <Pressable
          style={styles.menuItem}
          onPress={() => {
            setIsOpen(false);
            onHelp();
          }}
        >
          <Text style={styles.menuItemText}>❓ Help</Text>
        </Pressable>

        <Pressable
          style={styles.menuItem}
          onPress={() => {
            setIsOpen(false);
            checkForUpdates();
          }}
          disabled={updateCheckingVisible}
        >
          <Text
            style={[
              styles.menuItemText,
              updateCheckingVisible && styles.disabledText,
            ]}
          >
            🔄 Check for Updates
          </Text>
        </Pressable>

        <View style={styles.menuDivider} />

        <Pressable
          style={[styles.menuItem, styles.exitItem]}
          onPress={() => {
            setIsOpen(false);
            onExit();
          }}
        >
          <Text style={[styles.menuItemText, styles.exitText]}>🚪 Exit</Text>
        </Pressable>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  burgerButton: {
    position: "absolute",
    top: 40,
    left: 20,
    width: 40,
    height: 40,
    justifyContent: "space-around",
    zIndex: 1000,
    padding: 8,
  },
  burgerLine: {
    width: "100%",
    height: 3,
    backgroundColor: "#ffffff",
    borderRadius: 2,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
  },
  sideMenu: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 250,
    height: "100%",
    backgroundColor: "#1a1a2e",
    zIndex: 1001,
    paddingTop: 50,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#3498db",
  },
  menuTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3498db",
  },
  closeButton: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  menuItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2c2c4e",
  },
  menuItemText: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "500",
  },
  disabledText: {
    opacity: 0.5,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#3498db",
    marginVertical: 10,
  },
  exitItem: {
    backgroundColor: "#e74c3c",
  },
  exitText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  updateCheckingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1002,
  },
  updateCheckingBox: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3498db",
  },
  updateCheckingText: {
    color: "#ffffff",
    marginTop: 15,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default BurgerMenu;
