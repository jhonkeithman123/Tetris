import React from "react";
import { StyleSheet, View } from "react-native";
import Block from "./Block";
import { BoardCell } from "./engine";

interface BoardProps {
  board: BoardCell[][];
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
}

export default function Board({
  board,
  cellSize,
  boardWidth,
  boardHeight,
}: BoardProps) {
  return (
    <View style={styles.borderContainer}>
      <View
        style={[
          styles.board,
          {
            width: cellSize * boardWidth,
            height: cellSize * boardHeight,
          },
        ]}
      >
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <Block
                key={`${rowIndex}-${colIndex}`}
                color={cell.color}
                size={cellSize}
                isEmpty={!cell.filled}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  borderContainer: {
    position: "relative",
    borderWidth: 2,
    borderColor: "#3498db",
    borderRadius: 4,
    overflow: "hidden",
  },
  board: {
    backgroundColor: "#0f0f1e",
  },
  row: {
    flexDirection: "row",
  },
});
