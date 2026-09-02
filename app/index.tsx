import Help from "@/app/Help";
import useSound from "@/app/hooks/useSound";
import Leaderboard from "@/app/Leaderboard";
import PatchNotes from "@/app/PatchNotes";
import Settings from "@/app/Settings";
import Menu from "@/game/menu";
import TetrisGame from "@/game/TetrisGame";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import React, { useEffect, useRef, useState } from "react";
import { StatusBar, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

type Screen = "menu" | "game" | "settings" | "help" | "patchnotes" | "leaderboard";

export default function HomeScreen() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");
  const soundHook = useSound();
  const previousScreenRef = useRef<Screen | null>(null);
  const isInitialMount = useRef(true);
  const keepAwakeActiveRef = useRef(false);

  useEffect(() => {
    // Play menu music on initial mount
    if (isInitialMount.current) {
      const timer = setTimeout(() => {
        soundHook.playMusic("sound_track");
      }, 500);
      isInitialMount.current = false;
      return () => clearTimeout(timer);
    }

    // Handle screen transitions
    if (currentScreen === "menu" && previousScreenRef.current !== "menu") {
      soundHook.playMusic("sound_track");
    }

    previousScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    let isMounted = true;

    const handleKeepAwake = async () => {
      if (!isMounted) return;

      // Skip keep-awake in development to avoid screen-off errors
      if (__DEV__) {
        console.log("Keep awake disabled in development mode");
        return;
      }

      if (currentScreen === "game") {
        // Activate keep awake
        if (!keepAwakeActiveRef.current) {
          try {
            await activateKeepAwakeAsync().catch(() => {});
            if (isMounted) {
              keepAwakeActiveRef.current = true;
            }
          } catch (error) {
            // Keep awake not supported on this device/emulator
            if (isMounted) {
              keepAwakeActiveRef.current = false;
            }
          }
        }
      } else {
        // Deactivate keep awake
        if (keepAwakeActiveRef.current) {
          try {
            await deactivateKeepAwake().catch(() => {});
            if (isMounted) {
              keepAwakeActiveRef.current = false;
            }
          } catch (error) {
            // Ignore deactivation errors
            if (isMounted) {
              keepAwakeActiveRef.current = false;
            }
          }
        }
      }
    };

    // Call the function and suppress any unhandled rejections
    handleKeepAwake().catch(() => {});

    return () => {
      isMounted = false;
      if (keepAwakeActiveRef.current && !__DEV__) {
        try {
          deactivateKeepAwake()
            .catch(() => {})
            .finally(() => {
              keepAwakeActiveRef.current = false;
            });
        } catch {
          keepAwakeActiveRef.current = false;
        }
      }
    };
  }, [currentScreen]);

  const handleStartGame = () => {
    soundHook.stopMusic();
    setCurrentScreen("game");
  };

  const handleBackToMenu = () => {
    soundHook.stopMusic();
    setCurrentScreen("menu");
  };

  const handleShowSettings = () => {
    setCurrentScreen("settings");
  };

  const handleShowHelp = () => {
    setCurrentScreen("help");
  };

  const handleShowPatchNotes = () => {
    setCurrentScreen("patchnotes");
  };

  const handleShowLeaderboard = () => {
    setCurrentScreen("leaderboard");
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0b0b0b" />

        {currentScreen === "menu" && (
          <Menu
            onStartGame={handleStartGame}
            onShowSettings={handleShowSettings}
            onShowLeaderboard={handleShowLeaderboard}
            onHelp={handleShowHelp}
            onPatchNotes={handleShowPatchNotes}
          />
        )}

        {currentScreen === "game" && (
          <TetrisGame onBackToMenu={handleBackToMenu} soundHook={soundHook} />
        )}

        {currentScreen === "settings" && (
          <Settings
            onBack={handleBackToMenu}
            musicEnabled={soundHook.musicEnabled}
            sfxEnabled={soundHook.sfxEnabled}
            musicVolume={soundHook.musicVolume}
            sfxVolume={soundHook.sfxVolume}
            onMusicToggle={soundHook.setMusicEnabled}
            onSfxToggle={soundHook.setSfxEnabled}
            onMusicVolumeChange={soundHook.setMusicVolume}
            onSfxVolumeChange={soundHook.setSfxVolume}
          />
        )}

        {currentScreen === "help" && <Help onBack={handleBackToMenu} />}

        {currentScreen === "patchnotes" && (
          <PatchNotes onBack={handleBackToMenu} />
        )}

        {currentScreen === "leaderboard" && (
          <Leaderboard onBack={handleBackToMenu} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0b",
  },
});
