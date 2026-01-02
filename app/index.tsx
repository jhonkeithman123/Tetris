import Help from "@/app/Help";
import useSound from "@/app/hooks/useSound";
import Settings from "@/app/Settings";
import Menu from "@/game/menu";
import TetrisGame from "@/game/TetrisGame";
import React, { useEffect, useRef, useState } from "react";
import { StatusBar, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

type Screen = "menu" | "game" | "settings" | "help";

export default function HomeScreen() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");
  const soundHook = useSound();
  const previousScreenRef = useRef<Screen | null>(null);
  const isInitialMount = useRef(true);

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

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0b0b0b" />

        {currentScreen === "menu" && (
          <Menu
            onStartGame={handleStartGame}
            onShowSettings={handleShowSettings}
            onShowLeaderboard={handleShowHelp}
            onHelp={handleShowHelp}
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
