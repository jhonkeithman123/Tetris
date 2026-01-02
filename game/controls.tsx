import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface ControlsProps {
  onRotate: () => void;
  onMoveLeft: () => void;
  onMoveDown: () => void;
  onMoveRight: () => void;
  onHardDrop: () => void;
  isPaused: boolean;
  gameOver: boolean;
}

export default function Controls({
  onRotate,
  onMoveLeft,
  onMoveDown,
  onMoveRight,
  onHardDrop,
  isPaused,
  gameOver,
}: ControlsProps) {
  const [rotatePressed, setRotatePressed] = useState<boolean>(false);
  const [leftPressed, setLeftPressed] = useState<boolean>(false);
  const [downPressed, setDownPressed] = useState<boolean>(false);
  const [rightPressed, setRightPressed] = useState<boolean>(false);
  const [dropPressed, setDropPressed] = useState<boolean>(false);

  const handleRotate = () => {
    if (isPaused || gameOver) return;
    onRotate();
  };

  const handleMoveLeft = () => {
    if (isPaused || gameOver) return;
    onMoveLeft();
  };

  const handleMoveDown = () => {
    if (isPaused || gameOver) return;
    onMoveDown();
  };

  const handleMoveRight = () => {
    if (isPaused || gameOver) return;
    onMoveRight();
  };

  const handleHardDrop = () => {
    if (isPaused || gameOver) return;
    onHardDrop();
  };

  return (
    <View style={styles.controls}>
      <View style={styles.controlRow}>
        <Pressable
          style={[
            styles.controlButton,
            rotatePressed && styles.controlButtonPressed,
          ]}
          onPressIn={() => {
            setRotatePressed(true);
            handleRotate();
          }}
          onPressOut={() => setRotatePressed(false)}
        >
          <Text style={styles.controlButtonText}>↺</Text>
        </Pressable>

        <Pressable
          style={[
            styles.controlButton,
            leftPressed && styles.controlButtonPressed,
          ]}
          onPressIn={() => {
            setLeftPressed(true);
            handleMoveLeft();
          }}
          onPressOut={() => setLeftPressed(false)}
        >
          <Text style={styles.controlButtonText}>←</Text>
        </Pressable>

        <Pressable
          style={[
            styles.controlButton,
            downPressed && styles.controlButtonPressed,
          ]}
          onPressIn={() => {
            setDownPressed(true);
            handleMoveDown();
          }}
          onPressOut={() => setDownPressed(false)}
        >
          <Text style={styles.controlButtonText}>↓</Text>
        </Pressable>

        <Pressable
          style={[
            styles.controlButton,
            rightPressed && styles.controlButtonPressed,
          ]}
          onPressIn={() => {
            setRightPressed(true);
            handleMoveRight();
          }}
          onPressOut={() => setRightPressed(false)}
        >
          <Text style={styles.controlButtonText}>→</Text>
        </Pressable>

        <Pressable
          style={[
            styles.controlButton,
            styles.dropButton,
            dropPressed && styles.dropButtonPressed,
          ]}
          onPressIn={() => {
            setDropPressed(true);
            handleHardDrop();
          }}
          onPressOut={() => setDropPressed(false)}
        >
          <Text style={styles.controlButtonText}>⬇</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    paddingHorizontal: 10,
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  controlButton: {
    backgroundColor: "#3498db",
    width: 55,
    height: 55,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2980b9",
  },
  controlButtonPressed: {
    backgroundColor: "#2980b9",
    opacity: 0.7,
  },
  dropButton: {
    backgroundColor: "#e74c3c",
    borderColor: "#c0392b",
  },
  dropButtonPressed: {
    backgroundColor: "#c0392b",
    opacity: 0.7,
  },
  controlButtonText: {
    fontSize: 24,
    color: "#ffffff",
    fontWeight: "bold",
  },
});
