import React, { useRef } from "react";
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

// Low-latency DAS and ARR constants (in ms)
const DAS_LEFT_RIGHT = 150; // Initial delay before continuous move (modern standard)
const ARR_LEFT_RIGHT = 45;  // Auto-repeat rate interval for fluid sliding
const DAS_DOWN = 80;        // Soft drop starts almost immediately
const ARR_DOWN = 35;        // Soft drop repeat speed

function ControlsComponent({
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
  const leftIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rightIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const downIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const leftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const disabled = isPaused || gameOver;

  const startContinuousMove = (
    action: () => void,
    intervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
    timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    delay: number,
    initialDelay: number
  ) => {
    if (disabled) return;

    // Execute immediately on 0ms press
    action();

    // Clear any previous timer
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Schedule DAS -> ARR
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
            style={({ pressed }) => [
              styles.controlButton,
              styles.dpadButton,
              pressed && styles.controlButtonPressed,
              disabled && styles.controlButtonDisabled,
            ]}
            onPressIn={() => {
              startContinuousMove(
                onMoveLeft,
                leftIntervalRef,
                leftTimeoutRef,
                ARR_LEFT_RIGHT,
                DAS_LEFT_RIGHT
              );
            }}
            onPressOut={() => {
              stopContinuousMove(leftIntervalRef, leftTimeoutRef);
            }}
            disabled={disabled}
            hitSlop={6}
          >
            <Text style={styles.controlButtonText}>←</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.controlButton,
              styles.dpadButton,
              pressed && styles.controlButtonPressed,
              disabled && styles.controlButtonDisabled,
            ]}
            onPressIn={() => {
              startContinuousMove(
                onMoveRight,
                rightIntervalRef,
                rightTimeoutRef,
                ARR_LEFT_RIGHT,
                DAS_LEFT_RIGHT
              );
            }}
            onPressOut={() => {
              stopContinuousMove(rightIntervalRef, rightTimeoutRef);
            }}
            disabled={disabled}
            hitSlop={6}
          >
            <Text style={styles.controlButtonText}>→</Text>
          </Pressable>
        </View>

        {/* Bottom row: Down (centered) */}
        <View style={styles.dpadBottomRow}>
          <Pressable
            style={({ pressed }) => [
              styles.controlButton,
              styles.dpadButton,
              pressed && styles.controlButtonPressed,
              disabled && styles.controlButtonDisabled,
            ]}
            onPressIn={() => {
              startContinuousMove(
                onMoveDown,
                downIntervalRef,
                downTimeoutRef,
                ARR_DOWN,
                DAS_DOWN
              );
            }}
            onPressOut={() => {
              stopContinuousMove(downIntervalRef, downTimeoutRef);
            }}
            disabled={disabled}
            hitSlop={6}
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
            style={({ pressed }) => [
              styles.controlButton,
              styles.actionButton,
              styles.holdButton,
              pressed && styles.controlButtonPressed,
              (!canHold || disabled) && styles.controlButtonDisabled,
            ]}
            onPressIn={() => {
              if (canHold && !disabled) onHold();
            }}
            disabled={!canHold || disabled}
            hitSlop={6}
          >
            <Text style={styles.controlButtonText}>H</Text>
          </Pressable>

          {/* Hard Drop Button - Right position */}
          <Pressable
            style={({ pressed }) => [
              styles.controlButton,
              styles.dropButton,
              styles.actionButton,
              styles.hardDropButton,
              pressed && styles.dropButtonPressed,
              disabled && styles.controlButtonDisabled,
            ]}
            onPressIn={() => {
              if (!disabled) onHardDrop();
            }}
            disabled={disabled}
            hitSlop={6}
          >
            <Text style={styles.controlButtonText}>⬇</Text>
          </Pressable>
        </View>

        {/* Bottom row: Rotate Button (centered) - Instant response */}
        <View style={styles.actionBottomRow}>
          <Pressable
            style={({ pressed }) => [
              styles.controlButton,
              styles.actionButton,
              styles.rotateButton,
              pressed && styles.controlButtonPressed,
              disabled && styles.controlButtonDisabled,
            ]}
            onPressIn={() => {
              if (!disabled) onRotate();
            }}
            disabled={disabled}
            hitSlop={6}
          >
            <Text style={styles.controlButtonText}>↺</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default React.memo(ControlsComponent);

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
