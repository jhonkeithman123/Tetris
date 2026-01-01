import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import TetrisGame from "../game/TetrisGame";

export default function Index() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Tetris</Text>
        <View style={styles.view}>
          <TetrisGame />
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
    justifyContent: "flex-start",
    paddingTop: 20,
  },
  title: { fontSize: 24, fontWeight: "700", color: "#fff", marginBottom: 10 },
  view: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
});
