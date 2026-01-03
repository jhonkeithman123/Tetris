import { BlockColor, getBlockAsset } from "@/app/utils/blockAssets";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

interface BlockProps {
  color?: BlockColor;
  size: number;
  isEmpty?: boolean;
}

export default function Block({ color, size, isEmpty = false }: BlockProps) {
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
          },
        ]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blockContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  blockImage: {
    // The image fills the cell
  },
  emptyBlock: {
    backgroundColor: "#1a1a2e",
    borderWidth: 0.5,
    borderColor: "#2c2c4e",
  },
});
