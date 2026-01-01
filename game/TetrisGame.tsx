import React, { useState } from "react";
import { Text, View } from "react-native";
import styles from "./sass/TetrisGame.sass";

export default function TetrisGame() {
  const [score, setScore] = useState<number>(0);
  const [nextPiece, setNextPiece] = useState<any>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);

  return (
    <View style={styles.container}>
      <Text style={styles.score}>Score: {score}</Text>
      // Render Board // Render Controls
      {gameOver && <Text style={styles.gameOver}>Game Over</Text>}
    </View>
  );
}
