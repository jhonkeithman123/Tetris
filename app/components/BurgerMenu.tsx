import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DialogBox from "./Dialog";

// GitHub configuration
export const GITHUB_OWNER = "jhonkeithman123";
const GITHUB_REPO = "Tetris";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
export const CURRENT_VERSION = "1.1.0"; // TODO: UPDATE MANUALLY

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
}

const BurgerMenu = ({
  onExit,
  onHelp,
  onAccount,
  onPatchNotes,
}: {
  onExit: () => void;
  onHelp: () => void;
  onAccount: () => void;
  onPatchNotes: () => void;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [updateDialogVisible, setUpdateDialogVisible] =
    useState<boolean>(false);
  const [upToDateDialogVisible, setUpToDateDialogVisible] =
    useState<boolean>(false);
  const [updateCheckingVisible, setUpdateCheckingVisible] =
    useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
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
      const response = await fetch(GITHUB_API_URL, {
        method: "GET",
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Tetris-Game-App",
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }

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
      Alert.alert(
        "Error",
        "Unable to check for updates. Please check your internet connection and try again."
      );
    }
  };

  const downloadAndInstallUpdate = async () => {
    if (!updateInfo || Platform.OS !== "android") {
      Alert.alert("Error", "Updates are only available for Android.");
      return;
    }

    // Find APK asset
    const apkAsset = updateInfo.assets.find(
      (asset) => asset.name.endsWith(".apk") || asset.name.endsWith(".APK")
    );

    if (!apkAsset) {
      Alert.alert(
        "Error",
        "No APK file found in the release. Please download from GitHub."
      );
      Linking.openURL(updateInfo.html_url);
      return;
    }

    setUpdateDialogVisible(false);
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Use cacheDirectory which is available in all versions
      const downloadUri = (FileSystem as any).cacheDirectory + apkAsset.name;

      // Download with progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        apkAsset.browser_download_url,
        downloadUri,
        {},
        (downloadProgressEvent) => {
          const progress =
            downloadProgressEvent.totalBytesWritten /
            downloadProgressEvent.totalBytesExpectedToWrite;
          setDownloadProgress(progress * 100);
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (result && result.uri) {
        setIsDownloading(false);
        setDownloadProgress(100);

        // Install APK on Android
        if (Platform.OS === "android") {
          const fileUri = result.uri;

          // Try to install APK
          try {
            await IntentLauncher.startActivityAsync(
              "android.intent.action.VIEW",
              {
                data: fileUri,
                flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                type: "application/vnd.android.package-archive",
              }
            );
          } catch (intentError) {
            console.error("Intent error:", intentError);
            // Fallback: open in browser
            Alert.alert(
              "Manual Installation Required",
              "Please download and install the APK manually from GitHub.",
              [
                {
                  text: "Open GitHub",
                  onPress: () => Linking.openURL(updateInfo.html_url),
                },
                { text: "Cancel", style: "cancel" },
              ]
            );
          }
        }
      }
    } catch (error) {
      console.error("Download error:", error);
      setIsDownloading(false);
      Alert.alert(
        "Download Failed",
        "Failed to download the update. Please try downloading from GitHub.",
        [
          {
            text: "Open GitHub",
            onPress: () => updateInfo && Linking.openURL(updateInfo.html_url),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    }
  };

  const cancelDownload = () => {
    setIsDownloading(false);
    setDownloadProgress(0);
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

      {/* Download Progress Dialog */}
      {isDownloading && (
        <View style={styles.updateCheckingOverlay}>
          <View style={styles.downloadBox}>
            <Text style={styles.downloadTitle}>Downloading Update</Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[styles.progressBar, { width: `${downloadProgress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(downloadProgress)}%
            </Text>
            <Pressable style={styles.cancelButton} onPress={cancelDownload}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Update Available Dialog - Custom Scrollable */}
      {updateDialogVisible && updateInfo && (
        <View style={styles.updateCheckingOverlay}>
          <View style={styles.updateDialogBox}>
            <Text style={styles.updateDialogTitle}>Update Available</Text>
            <Text style={styles.updateVersion}>
              Version {updateInfo.tag_name}
            </Text>

            <ScrollView
              style={styles.updateScrollView}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.updateDescription}>
                {updateInfo.body || "No description available."}
              </Text>
            </ScrollView>

            <View style={styles.updateDialogButtons}>
              <Pressable
                style={[styles.updateButton, styles.updateButtonPrimary]}
                onPress={downloadAndInstallUpdate}
              >
                <Text style={styles.updateButtonText}>Update Now</Text>
              </Pressable>
              <Pressable
                style={[styles.updateButton, styles.updateButtonSecondary]}
                onPress={() => setUpdateDialogVisible(false)}
              >
                <Text style={styles.updateButtonTextSecondary}>Later</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Up to Date Dialog */}
      <DialogBox
        visible={upToDateDialogVisible}
        title="Up to Date"
        message={`You're running the latest version (${CURRENT_VERSION})!\n\nNo updates available at this time.`}
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
            onPatchNotes();
          }}
        >
          <Text style={styles.menuItemText}>📝 Patch Notes</Text>
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
  updateDialogBox: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxHeight: "80%",
    borderWidth: 2,
    borderColor: "#3498db",
  },
  updateDialogTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3498db",
    marginBottom: 10,
    textAlign: "center",
  },
  updateVersion: {
    fontSize: 18,
    color: "#e67e22",
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "600",
  },
  updateScrollView: {
    maxHeight: 300,
    marginBottom: 20,
  },
  updateDescription: {
    fontSize: 14,
    color: "#ffffff",
    lineHeight: 22,
  },
  updateDialogButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  updateButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  updateButtonPrimary: {
    backgroundColor: "#3498db",
  },
  updateButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#3498db",
  },
  updateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  updateButtonTextSecondary: {
    color: "#3498db",
    fontSize: 16,
    fontWeight: "bold",
  },
  downloadBox: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3498db",
    width: "80%",
  },
  downloadTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 20,
  },
  progressBarContainer: {
    width: "100%",
    height: 20,
    backgroundColor: "#2c2c4e",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#3498db",
    borderRadius: 10,
  },
  progressText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: "#e74c3c",
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default BurgerMenu;
