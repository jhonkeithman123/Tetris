import AuthModal from "@/app/components/AuthModal";
import BurgerMenu from "@/app/components/BurgerMenu";
import DialogBox from "@/app/components/Dialog";
import FriendsModal from "@/app/components/FriendsModal";
import authService from "@/app/services/authService";
import {
  BlockColor,
  getBlockAsset,
  getRandomBlockColor,
} from "@/app/utils/blockAssets";
import { useFonts } from "expo-font";
import { User } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { height, width } = Dimensions.get("window");
const GRID_SIZE = 40;

interface MenuProps {
  onStartGame: () => void;
  onShowSettings?: () => void;
  onShowLeaderboard?: () => void;
  onHelp?: () => void;
  onPatchNotes?: () => void;
}

interface FallingBlock {
  id: number;
  color: BlockColor;
  x: number;
  animatedY: Animated.Value;
  rotation: Animated.Value;
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
  onPatchNotes,
}: MenuProps) {
  const [playPressed, setPlayPressed] = useState<boolean>(false);
  const [leaderboardPressed, setLeaderboardPressed] = useState<boolean>(false);
  const [settingsPressed, setSettingsPressed] = useState<boolean>(false);
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);
  const [quitDialogVisible, setQuitDialogVisible] = useState<boolean>(false);
  const [authModalVisible, setAuthModalVisible] = useState<boolean>(false);
  const [friendsModalVisible, setFriendsModalVisible] = useState<boolean>(false);
  const [accountDialogVisible, setAccountDialogVisible] =
    useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(
    authService.getCurrentUser()
  );

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthState((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

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

  if (!fontsLoaded) {
    return null;
  }

  const handleQuit = () => {
    BackHandler.exitApp();
  };

  const handleHelp = () => {
    if (onHelp) {
      onHelp();
    }
  };

  const handleLeaderboard = () => {
    if (onShowLeaderboard) {
      onShowLeaderboard();
    }
  };

  const handleAccount = () => {
    if (currentUser) {
      setAccountDialogVisible(true);
    } else {
      setAuthModalVisible(true);
    }
  };

  const handleSignOut = async () => {
    setAccountDialogVisible(false);
    await authService.signOut();
  };

  const handlePatchNotes = () => {
    if (onPatchNotes) {
      onPatchNotes();
    }
  };

  return (
    <View style={styles.container}>
      <GridBackground />
      <AnimatedBackground />

      {/* Top Right Account Status Pill */}
      <Pressable style={styles.accountPill} onPress={handleAccount}>
        <View style={currentUser ? styles.onlineDot : styles.offlineDot} />
        <Text style={styles.accountPillText} numberOfLines={1}>
          {currentUser
            ? currentUser.displayName || currentUser.email?.split("@")[0] || "Player"
            : "Guest (Sign In)"}
        </Text>
      </Pressable>

      <BurgerMenu
        onExit={() => setQuitDialogVisible(true)}
        onHelp={handleHelp}
        onAccount={handleAccount}
        onFriends={() => setFriendsModalVisible(true)}
        onPatchNotes={handlePatchNotes}
      />

      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSuccess={() => setAuthModalVisible(false)}
      />

      <FriendsModal
        visible={friendsModalVisible}
        onClose={() => setFriendsModalVisible(false)}
        onOpenAuth={() => setAuthModalVisible(true)}
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

      {/* Account Info / Sign Out Dialog */}
      <DialogBox
        visible={accountDialogVisible}
        title="Player Profile"
        message={`Logged in as: ${
          currentUser?.displayName || currentUser?.email || "Player"
        }\n\nScores automatically sync to Global Leaderboard.\n\nWould you like to sign out?`}
        type="confirm"
        confirmText="Sign Out"
        cancelText="Close"
        onConfirm={handleSignOut}
        onCancel={() => setAccountDialogVisible(false)}
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
  accountPill: {
    position: "absolute",
    top: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20, 20, 36, 0.85)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3498db",
    zIndex: 10,
    elevation: 6,
  },
  accountPillText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
    maxWidth: 120,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2ecc71",
    marginRight: 6,
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f39c12",
    marginRight: 6,
  },
});
