import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface LineClearEffectProps {
  clearingRows: number[]; // Indices of rows being cleared
  cellSize: number;
  boardWidth: number;
  linesCount: number;
  comboCount: number;
  onAnimationEnd: () => void;
}

export default function LineClearEffect({
  clearingRows,
  cellSize,
  boardWidth,
  linesCount,
  comboCount,
  onAnimationEnd,
}: LineClearEffectProps) {
  const flashAnim = useRef(new Animated.Value(0)).current;
  const sweepAnim = useRef(new Animated.Value(0)).current;
  const bannerScale = useRef(new Animated.Value(0.3)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerTranslateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    if (clearingRows.length === 0) return;

    // Run parallel artistic elimination sequence
    Animated.parallel([
      // 1. Radiant Flash on the rows
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0.2,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0.9,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 90,
          useNativeDriver: true,
        }),
      ]),

      // 2. Horizontal particle laser sweep across board
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),

      // 3. Floating Arcade Banner (Single/Double/Triple/TETRIS)
      Animated.sequence([
        Animated.parallel([
          Animated.spring(bannerScale, {
            toValue: 1.15,
            friction: 4,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(bannerOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(bannerTranslateY, {
            toValue: -10,
            duration: 220,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onAnimationEnd();
    });
  }, [clearingRows]);

  if (clearingRows.length === 0) return null;

  const totalWidth = cellSize * boardWidth;
  const middleRow =
    clearingRows[Math.floor(clearingRows.length / 2)] * cellSize;

  // Determine banner title
  const getBannerTitle = () => {
    if (linesCount >= 4) return "⚡ TETRIS! ⚡";
    if (linesCount === 3) return "TRIPLE!";
    if (linesCount === 2) return "DOUBLE!";
    return "LINE CLEAR!";
  };

  const isTetris = linesCount >= 4;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Radiant Flash and Laser Sweep across each clearing row */}
      {clearingRows.map((rowIndex) => (
        <View
          key={`clear-row-${rowIndex}`}
          style={[
            styles.clearingRowContainer,
            {
              top: rowIndex * cellSize,
              height: cellSize,
              width: totalWidth,
            },
          ]}
        >
          {/* Intense Flash Layer */}
          <Animated.View
            style={[
              styles.flashLayer,
              isTetris ? styles.tetrisFlash : styles.standardFlash,
              {
                opacity: flashAnim,
              },
            ]}
          />

          {/* Laser Particle Sweep Beam */}
          <Animated.View
            style={[
              styles.sweepBeam,
              {
                width: totalWidth,
                transform: [
                  {
                    scaleX: sweepAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1.2],
                    }),
                  },
                ],
                opacity: sweepAnim.interpolate({
                  inputRange: [0, 0.7, 1],
                  outputRange: [1, 0.9, 0],
                }),
              },
            ]}
          />
        </View>
      ))}

      {/* Floating Arcade Banner */}
      <Animated.View
        style={[
          styles.bannerWrapper,
          {
            top: Math.max(10, middleRow - 24),
            width: totalWidth,
            opacity: bannerOpacity,
            transform: [
              { scale: bannerScale },
              { translateY: bannerTranslateY },
            ],
          },
        ]}
      >
        <Text style={[styles.bannerText, isTetris && styles.tetrisBannerText]}>
          {getBannerTitle()}
        </Text>
        {comboCount > 1 && (
          <Text style={styles.comboBadgeText}>{comboCount}x COMBO!</Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  clearingRowContainer: {
    position: "absolute",
    left: 0,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  flashLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  standardFlash: {
    backgroundColor: "#00ffff",
    shadowColor: "#00ffff",
    shadowRadius: 10,
    shadowOpacity: 0.9,
  },
  tetrisFlash: {
    backgroundColor: "#ffffff",
    shadowColor: "#ffd700",
    shadowRadius: 16,
    shadowOpacity: 1,
  },
  sweepBeam: {
    height: 3,
    backgroundColor: "#ffffff",
    shadowColor: "#00ffff",
    shadowRadius: 8,
    shadowOpacity: 1,
    elevation: 6,
  },
  bannerWrapper: {
    position: "absolute",
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  bannerText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#00ffff",
    letterSpacing: 2,
    textShadowColor: "#0055ff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    backgroundColor: "rgba(10, 10, 30, 0.75)",
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#00ffff",
    overflow: "hidden",
  },
  tetrisBannerText: {
    fontSize: 22,
    color: "#ffe600",
    textShadowColor: "#ff0055",
    borderColor: "#ffe600",
  },
  comboBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#ff007f",
    marginTop: 2,
    letterSpacing: 1,
    textShadowColor: "#000",
    textShadowRadius: 4,
  },
});
