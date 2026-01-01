import TetrisGame from "@/game/TetrisGame";
import Menu from "@/game/menu";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.view}>
          {gameStarted ? (
            <TetrisGame />
          ) : (
            <Menu onStartGame={() => setGameStarted(true)} />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0b",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
  },
  view: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
});
