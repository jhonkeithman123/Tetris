export const BLOCKS = {
  cross_block: {
    blue: require("../assets/images/blocks/cross_block/blue.png"),
    green: require("../assets/images/blocks/cross_block/green.png"),
    purple: require("../assets/images/blocks/cross_block/purple.png"),
    yellow: require("../assets/images/blocks/cross_block/yellow.png"),
    red: require("../assets/images/blocks/cross_block/red.png"),
  },
  L_block: {
    blue: require("../assets/images/blocks/L_block/blue.png"),
    green: require("../assets/images/blocks/L_block/green.png"),
    purple: require("../assets/images/blocks/L_block/purple.png"),
    yellow: require("../assets/images/blocks/L_block/yellow.png"),
    red: require("../assets/images/blocks/L_block/red.png"),
  },
  short_L_block: {
    blue: require("../assets/images/blocks/short_L_block/blue.png"),
    green: require("../assets/images/blocks/short_L_block/green.png"),
    purple: require("../assets/images/blocks/short_L_block/purple.png"),
    yellow: require("../assets/images/blocks/short_L_block/yellow.png"),
    red: require("../assets/images/blocks/short_L_block/red.png"),
  },
  short_T_block: {
    blue: require("../assets/images/blocks/short_T_block/blue.png"),
    green: require("../assets/images/blocks/short_T_block/green.png"),
    purple: require("../assets/images/blocks/short_T_block/purple.png"),
    yellow: require("../assets/images/blocks/short_T_block/yellow.png"),
    red: require("../assets/images/blocks/short_T_block/red.png"),
  },
  square_block: {
    blue: require("../assets/images/blocks/square_block/blue.png"),
    green: require("../assets/images/blocks/square_block/green.png"),
    purple: require("../assets/images/blocks/square_block/purple.png"),
    yellow: require("../assets/images/blocks/square_block/yellow.png"),
    red: require("../assets/images/blocks/square_block/red.png"),
  },
  straight_block: {
    blue: require("../assets/images/blocks/straight_block/blue.png"),
    green: require("../assets/images/blocks/straight_block/green.png"),
    purple: require("../assets/images/blocks/straight_block/purple.png"),
    yellow: require("../assets/images/blocks/straight_block/yellow.png"),
    red: require("../assets/images/blocks/straight_block/red.png"),
  },
  U_block: {
    blue: require("../assets/images/blocks/U_block/blue.png"),
    green: require("../assets/images/blocks/U_block/green.png"),
    purple: require("../assets/images/blocks/U_block/purple.png"),
    yellow: require("../assets/images/blocks/U_block/yellow.png"),
    red: require("../assets/images/blocks/U_block/red.png"),
  },
  zig_block: {
    blue: require("../assets/images/blocks/zig_block/blue.png"),
    green: require("../assets/images/blocks/zig_block/green.png"),
    purple: require("../assets/images/blocks/zig_block/purple.png"),
    yellow: require("../assets/images/blocks/zig_block/yellow.png"),
    red: require("../assets/images/blocks/zig_block/red.png"),
  },
};

export type BlockType = keyof typeof BLOCKS;
export type BlockColor = "blue" | "green" | "purple" | "yellow" | "red";

export const BLOCK_TYPES: BlockType[] = Object.keys(BLOCKS) as BlockType[];
export const BLOCK_COLORS: BlockColor[] = [
  "blue",
  "green",
  "purple",
  "yellow",
  "red",
];

/**
 * Get a block image asset by type and color
 */
export function getBlockAsset(type: BlockType, color: BlockColor) {
  return BLOCKS[type][color];
}

/**
 * Get a random block type
 */
export function getRandomBlockType(): BlockType {
  return BLOCK_TYPES[Math.floor(Math.random() * BLOCK_TYPES.length)];
}

/**
 * Get a random block color
 */
export function getRandomBlockColor(): BlockColor {
  return BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
}

/**
 * Get a random block asset (type + color)
 */
export function getRandomBlockAsset() {
  const type = getRandomBlockType();
  const color = getRandomBlockColor();
  return {
    type,
    color,
    asset: getBlockAsset(type, color),
  };
}
