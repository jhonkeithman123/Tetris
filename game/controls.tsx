import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface ControlsProps {
  onRotate: () => void;
  onMoveLeft: () => void;
  onMoveDown: () => void;
  onMoveRight: () => void;
  onHardDrop: () => void;
  onHold: () => void;
  canHold: boolean;
  isPaused: boolean;
  gameOver: boolean;
}

export default function Controls({
  onRotate,
  onMoveLeft,
  onMoveDown,
  onMoveRight,
  onHardDrop,
  onHold,
  canHold,
  isPaused,
  gameOver,
}: ControlsProps) {
  // Left Controls
  const [leftPressed, setLeftPressed] = useState<boolean>(false);
  const [rightPressed, setRightPressed] = useState<boolean>(false);
  const [downPressed, setDownPressed] = useState<boolean>(false);

  // Right Controls
  const [hardDropPressed, setHardDropPressed] = useState<boolean>(false);
  const [rotatePressed, setRotatePressed] = useState<boolean>(false);
  const [holdPressed, setHoldPressed] = useState<boolean>(false);

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

      {/* Action Buttons (Right side) - 3-button circular style */}
      <View style={styles.actionContainer}>
        <View style={styles.actionTopRow}>
          {/* Hold Button - Left position */}
          <Pressable
            style={[
              styles.controlButton,
              styles.actionButton,
              styles.holdButton,
              holdPressed && styles.controlButtonPressed,
              (!canHold || disabled) && styles.controlButtonDisabled,
            ]}
            onPressIn={() => {
              setHoldPressed(true);
              onHold();
            }}
            onPressOut={() => setHoldPressed(false)}
            disabled={!canHold || disabled}
          >
            <Text style={styles.controlButtonText}>H</Text>
          </Pressable>

          {/* Hard Drop Button - Right position */}
          <Pressable
            style={[
              styles.controlButton,
              styles.dropButton,
              styles.actionButton,
              styles.hardDropButton,
              hardDropPressed && styles.dropButtonPressed,
              disabled && styles.controlButtonDisabled,
            ]}
            onPressIn={() => {
              setHardDropPressed(true);
              onHardDrop();
            }}
            onPressOut={() => setHardDropPressed(false)}
            disabled={disabled}
          >
            <Text style={styles.controlButtonText}>⬇</Text>
          </Pressable>
        </View>
        {/* Bottom row: Rotate Button (centered) */}
        <View style={styles.actionBottomRow}>
          {/* Rotate Button - Bottom position */}
          <Pressable
            style={[
              styles.controlButton,
              styles.actionButton,
              styles.rotateButton,
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
  actionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 8,
  },
  actionBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    right: -15,
    margin: 10,
  },
  holdButton: {
    backgroundColor: "#9b59b6",
    borderColor: "#8e44ad",
  },
  rotateButton: {},
  hardDropButton: {},
});
