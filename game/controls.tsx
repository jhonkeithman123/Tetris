import React, { useRef, useState } from "react";
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

  const leftIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rightIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const downIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rotateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const leftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const disabled = isPaused || gameOver;

  const startContinuousMove = (
    action: () => void,
    intervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
    timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    delay: number = 100,
    initialDelay: number = 300
  ) => {
    if (disabled) return;

    // Execute immediately
    action();

    // Clear any existing timeout/interval
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Wait for initial delay before starting continuous movement
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        action();
      }, delay);
    }, initialDelay);
  };

  const stopContinuousMove = (
    intervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
    timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  ) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return (
    <View style={styles.container}>
      {/* D-Pad (Left side) - Arrow buttons */}
      <View style={styles.dpadContainer}>
        {/* Top row: Left and Right */}
        <View style={styles.dpadTopRow}>
          <Pressable
            style={[
              styles.controlButton,
              styles.dpadButton,
              leftPressed && styles.controlButtonPressed,
              disabled && styles.controlButtonDisabled,
            ]}
            onPressIn={() => {
              setLeftPressed(true);
              startContinuousMove(
                onMoveLeft,
                leftIntervalRef,
                leftTimeoutRef,
                100,
                300
              );
            }}
            onPressOut={() => {
              setLeftPressed(false);
              stopContinuousMove(leftIntervalRef, leftTimeoutRef);
            }}
            disabled={disabled}
          >
            <Text style={styles.controlButtonText}>←</Text>
          </Pressable>

          <Pressable
            style={[
              styles.controlButton,
              styles.dpadButton,
              rightPressed && styles.controlButtonPressed,
              disabled && styles.controlButtonDisabled,
            ]}
            onPressIn={() => {
              setRightPressed(true);
              startContinuousMove(
                onMoveRight,
                rightIntervalRef,
                rightTimeoutRef,
                100,
                300
              );
            }}
            onPressOut={() => {
              setRightPressed(false);
              stopContinuousMove(rightIntervalRef, rightTimeoutRef);
            }}
            disabled={disabled}
          >
            <Text style={styles.controlButtonText}>→</Text>
          </Pressable>
        </View>

        {/* Bottom row: Down (centered) */}
        <View style={styles.dpadBottomRow}>
          <Pressable
            style={[
              styles.controlButton,
              styles.dpadButton,
              downPressed && styles.controlButtonPressed,
              disabled && styles.controlButtonDisabled,
            ]}
            onPressIn={() => {
              setDownPressed(true);
              startContinuousMove(
                onMoveDown,
                downIntervalRef,
                downTimeoutRef,
                50,
                300
              );
            }}
            onPressOut={() => {
              setDownPressed(false);
              stopContinuousMove(downIntervalRef, downTimeoutRef);
            }}
            disabled={disabled}
          >
            <Text style={styles.controlButtonText}>↓</Text>
          </Pressable>
        </View>
      </View>

      {/* Action Buttons (Right side) - Game Boy style */}
      <View style={styles.actionContainer}>
        <View style={styles.actionButtonsWrapper}>
          {/* B Button (Rotate) - Lower left */}
          <Pressable
            style={[
              styles.controlButton,
              styles.actionButton,
              styles.bButton,
              rotatePressed && styles.controlButtonPressed,
              disabled && styles.controlButtonDisabled,
            ]}
            onPressIn={() => {
              setRotatePressed(true);
              startContinuousMove(
                onRotate,
                rotateIntervalRef,
                rotateTimeoutRef,
                150,
                300
              );
            }}
            onPressOut={() => {
              setRotatePressed(false);
              stopContinuousMove(rotateIntervalRef, rotateTimeoutRef);
            }}
            disabled={disabled}
          >
            <Text style={styles.controlButtonText}>↺</Text>
          </Pressable>

          {/* A Button (Hard Drop) - Upper right */}
          <Pressable
            style={[
              styles.controlButton,
              styles.dropButton,
              styles.actionButton,
              styles.aButton,
              dropPressed && styles.dropButtonPressed,
              disabled && styles.controlButtonDisabled,
            ]}
            onPressIn={() => {
              setDropPressed(true);
              onHardDrop();
            }}
            onPressOut={() => setDropPressed(false)}
            disabled={disabled}
          >
            <Text style={styles.controlButtonText}>⬇</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    maxWidth: 450,
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  dpadContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  dpadTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 8,
  },
  dpadBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  controlButton: {
    backgroundColor: "#3498db",
    width: 65,
    height: 65,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2980b9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dpadButton: {
    // D-pad specific styles
    left: -15,
    margin: 10,
  },
  controlButtonPressed: {
    backgroundColor: "#2980b9",
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  controlButtonDisabled: {
    opacity: 0.3,
  },
  dropButton: {
    backgroundColor: "#e74c3c",
    borderColor: "#c0392b",
  },
  dropButtonPressed: {
    backgroundColor: "#c0392b",
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  controlButtonText: {
    fontSize: 28,
    color: "#ffffff",
    fontWeight: "bold",
  },
  actionContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonsWrapper: {
    position: "relative",
    width: 180,
    height: 120,
  },
  actionButton: {
    position: "absolute",
  },
  bButton: {
    bottom: 10,
    left: 30,
    transform: [{ rotate: "-15deg" }],
  },
  aButton: {
    top: 10,
    right: -10,
    transform: [{ rotate: "-15deg" }],
  },
});
