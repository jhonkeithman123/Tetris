import { BlockColor, getBlockAsset } from "@/app/utils/blockAssets";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

interface BlockProps {
  color?: BlockColor;
  size: number;
  isEmpty?: boolean;
  isGhost?: boolean;
}

export default function Block({
  color,
  size,
  isEmpty = false,
  isGhost,
}: BlockProps) {
  if (isEmpty || !color) {
    return (
      <View
        style={[
          styles.emptyBlock,
          {
            width: size,
            height: size,
          },
        ]}
      />
    );
  }

  if (isGhost) {
    return (
      <View
        style={[
          styles.ghostBlock,
          {
            width: size,
            height: size,
            borderColor: getGhostColor(color),
          },
        ]}
      />
    );
  }

  const blockAsset = getBlockAsset(color);

  return (
    <View
      style={[
        styles.blockContainer,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <Image
        source={blockAsset}
        style={[
          styles.blockImage,
          {
            width: size,
            height: size,
            // opacity: isGhost ? 0.3 : 1,
          },
        ]}
        resizeMode="cover"
      />
    </View>
  );
}

// Get bright outline color based on block color
const getGhostColor = (color: BlockColor): string => {
  const colorMap: { [key in BlockColor]: string } = {
    blue: "#00FFFF", // Cyan
    green: "#00FF00", // Bright Green
    purple: "#FF00FF", // Magenta
    yellow: "#FFFF00", // Yellow
    red: "#FF0000", // Red
    orange: "#FFA500", // Orange
    white: "#FFFFFF", // White
    lightblue: "#87CEEB", // Sky Blue
    pink: "#FF69B4", // Hot Pink
  };
  return colorMap[color] || "#FFFFFF";
};

const styles = StyleSheet.create({
  blockContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  blockImage: {
    position: "absolute",
  },
  emptyBlock: {
    backgroundColor: "#1a1a2e",
    borderWidth: 0.5,
    borderColor: "#2c2c4e",
  },
  ghostBlock: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderStyle: "solid",
  },
});
