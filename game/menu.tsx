import BurgerMenu from "@/app/components/BurgerMenu";
import DialogBox from "@/app/components/Dialog";
import {
  BlockColor,
  getBlockAsset,
  getRandomBlockColor,
} from "@/app/utils/blockAssets";
import { useFonts } from "expo-font";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { height, width } = Dimensions.get("window");
const GRID_SIZE = 40;

// GitHub configuration
const GITHUB_OWNER = "jhonkeithman123"; // GitHub username
const GITHUB_REPO = "Tetris"; // Repo name
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
let CURRENT_VERSION = "1.0.0"; // TODO: UPDATE MANUALLY

interface MenuProps {
  onStartGame: () => void;
  onShowSettings?: () => void;
  onShowLeaderboard?: () => void;
  onHelp?: () => void;
}

interface FallingBlock {
  id: number;
  color: BlockColor;
  x: number;
  animatedY: Animated.Value;
  rotation: Animated.Value;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
}

const AnimatedBackground = () => {
  const [blocks, setBlocks] = useState<FallingBlock[]>([]);
  const blockIdRef = useRef(0);

  useEffect(() => {
    const spawnBlock = () => {
      const initialRotation = Math.random() * 360;
      const color = getRandomBlockColor();

      const newBlock: FallingBlock = {
        id: blockIdRef.current++,
        color,
        x: Math.random() * (width - 60),
        animatedY: new Animated.Value(-100),
        rotation: new Animated.Value(Math.random() * 360),
      };

      setBlocks((prev) => [...prev, newBlock]);

      Animated.parallel([
        Animated.timing(newBlock.animatedY, {
          toValue: height + 100,
          duration: 8000 + Math.random() * 4000,
          useNativeDriver: true,
        }),
        Animated.timing(newBlock.rotation, {
          toValue: initialRotation + 360,
          duration: 8000 + Math.random() * 4000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setBlocks((prev) => prev.filter((b) => b.id !== newBlock.id));
      });
    };

    const interval = setInterval(spawnBlock, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.animatedBackground}>
      {blocks.map((block) => {
        const blockAsset = getBlockAsset(block.color);

        return (
          <Animated.View
            key={block.id}
            style={[
              styles.fallingBlock,
              {
                left: block.x,
                transform: [
                  { translateY: block.animatedY },
                  {
                    rotate: block.rotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={blockAsset}
              style={styles.blockImage}
              resizeMode="contain"
            />
          </Animated.View>
        );
      })}
    </View>
  );
};

const GridBackground = () => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateY, {
        toValue: GRID_SIZE,
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      { resetBeforeIteration: true }
    ).start();
  }, []);

  const verticalLines = Math.ceil(width / GRID_SIZE) + 1;
  const horizontalLines = Math.ceil(height / GRID_SIZE) + 2;

  return (
    <Animated.View
      style={[styles.gridContainer, { transform: [{ translateY }] }]}
    >
      {/* Vertical lines */}
      {Array.from({ length: verticalLines }).map((_, i) => (
        <View
          key={`v-${i}`}
          style={[
            styles.gridLine,
            styles.verticalLine,
            { left: i * GRID_SIZE },
          ]}
        />
      ))}
      {/* Horizontal lines */}
      {Array.from({ length: horizontalLines }).map((_, i) => (
        <View
          key={`h-${i}`}
          style={[
            styles.gridLine,
            styles.horizontalLine,
            { top: i * GRID_SIZE },
          ]}
        />
      ))}
    </Animated.View>
  );
};

export default function Menu({
  onStartGame,
  onShowSettings,
  onShowLeaderboard,
  onHelp,
}: MenuProps) {
  const [playPressed, setPlayPressed] = useState<boolean>(false);
  const [leaderboardPressed, setLeaderboardPressed] = useState<boolean>(false);
  const [settingsPressed, setSettingsPressed] = useState<boolean>(false);
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);
  const [quitDialogVisible, setQuitDialogVisible] = useState<boolean>(false);
  const [leaderboardDialogVisible, setLeaderboardDialogVisible] =
    useState<boolean>(false);
  const [accountDialogVisible, setAccountDialogVisible] =
    useState<boolean>(false);
  const [updateDialogVisible, setUpdateDialogVisible] =
    useState<boolean>(false);
  const [updateCheckingVisible, setUpdateCheckingVisible] =
    useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<GitHubRelease | null>(null);

  const [fontsLoaded] = useFonts({
    Tetris: require("@/assets/font/Tetris.ttf"),
  });

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setQuitDialogVisible(true);
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    // Check for updates on app start
    checkForUpdates();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const compareVersions = (latest: string, current: string): boolean => {
    // Remove 'v' prefix if present
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

  const handleQuit = () => {
    BackHandler.exitApp();
  };

  const handleHelp = () => {
    if (onHelp) {
      onHelp();
    }
  };

  const handleLeaderboard = () => {
    setLeaderboardDialogVisible(true);
  };

  const handleAccount = () => {
    setAccountDialogVisible(true);
  };

  return (
    <View style={styles.container}>
      <GridBackground />
      <AnimatedBackground />

      <BurgerMenu
        onExit={() => setQuitDialogVisible(true)}
        onHelp={handleHelp}
        onAccount={handleAccount}
      />

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

      {/* Welcome Dialog */}
      <DialogBox
        visible={dialogVisible}
        title="Welcome"
        message="Welcome to Tetris!"
        type="alert"
        onConfirm={() => setDialogVisible(false)}
      />

      {/* Quit Dialog */}
      <DialogBox
        visible={quitDialogVisible}
        title="Quit Game"
        message="Are you sure you want to exit?"
        type="confirm"
        confirmText="Quit"
        cancelText="Cancel"
        onConfirm={handleQuit}
        onCancel={() => setQuitDialogVisible(false)}
      />

      {/* Leaderboard Coming Soon Dialog */}
      <DialogBox
        visible={leaderboardDialogVisible}
        title="Coming Soon"
        message="Leaderboard feature is not implemented yet. Stay tuned for future updates!"
        type="alert"
        onConfirm={() => setLeaderboardDialogVisible(false)}
      />

      {/* Account Coming Soon Dialog */}
      <DialogBox
        visible={accountDialogVisible}
        title="Coming Soon"
        message="Account feature is not implemented yet. Stay tuned for future updates!"
        type="alert"
        onConfirm={() => setAccountDialogVisible(false)}
      />

      <View style={styles.logoContainer}>
        <Pressable onPress={() => setDialogVisible(true)}>
          <Image
            source={require("@/assets/images/Logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Pressable>
      </View>
      <View style={styles.buttonContainer}>
        <Pressable
          onPressIn={() => setPlayPressed(true)}
          onPressOut={() => setPlayPressed(false)}
          onPress={onStartGame}
        >
          <Image
            source={
              playPressed
                ? require("@/assets/images/buttons/play/Touched.png")
                : require("@/assets/images/buttons/play/Default.png")
            }
            style={styles.button}
            resizeMode="contain"
          />
        </Pressable>

        {onShowLeaderboard && (
          <Pressable
            onPressIn={() => setLeaderboardPressed(true)}
            onPressOut={() => setLeaderboardPressed(false)}
            onPress={handleLeaderboard}
          >
            <Image
              source={
                leaderboardPressed
                  ? require("../assets/images/buttons/leaderboards/Touched.png")
                  : require("../assets/images/buttons/leaderboards/Default.png")
              }
              style={styles.button}
              resizeMode="contain"
            />
          </Pressable>
        )}

        {onShowSettings && (
          <Pressable
            onPressIn={() => setSettingsPressed(true)}
            onPressOut={() => setSettingsPressed(false)}
            onPress={onShowSettings}
          >
            <Image
              source={
                settingsPressed
                  ? require("../assets/images/buttons/settings/Touched.png")
                  : require("../assets/images/buttons/settings/Default.png")
              }
              style={styles.button}
              resizeMode="contain"
            />
          </Pressable>
        )}

        {/* Check for Updates Button */}
        <Pressable
          onPress={checkForUpdates}
          disabled={updateCheckingVisible}
          style={[
            styles.updateButton,
            updateCheckingVisible && styles.updateButtonDisabled,
          ]}
        >
          <Text style={styles.updateButtonText}>
            {updateCheckingVisible ? "Checking..." : "Check for Updates"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "#0080ff",
    width: "100%",
    overflow: "hidden",
  },
  animatedBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  fallingBlock: {
    position: "absolute",
    width: 50,
    height: 50,
    opacity: 0.4,
  },
  blockImage: {
    width: "100%",
    height: "100%",
  },
  gridContainer: {
    position: "absolute",
    top: -GRID_SIZE,
    left: 0,
    width: width,
    height: height + GRID_SIZE * 2,
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "#ffffff",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 5,
  },
  verticalLine: {
    width: 1,
    height: "100%",
  },
  horizontalLine: {
    height: 1,
    width: "100%",
  },
  logoContainer: {
    top: -height * 0.21,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  buttonContainer: {
    width: "80%",
    maxWidth: 300,
    alignItems: "center",
  },
  button: {
    width: 230,
    height: 60,
    marginVertical: 10,
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
    zIndex: 1000,
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
  updateButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
    width: "100%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#229954",
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
