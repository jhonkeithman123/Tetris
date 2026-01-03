const imagePathBlock = "@/assets/images/blocks";
const ext = ".png";

export type BlockColor =
  | "blue"
  | "green"
  | "purple"
  | "yellow"
  | "red"
  | "orange"
  | "white"
  | "lightblue"
  | "pink";

// Single block per color
export const BLOCKS = {
  blue: require(`${imagePathBlock}/blue${ext}`),
  green: require(`${imagePathBlock}/green${ext}`),
  purple: require(`${imagePathBlock}/purple${ext}`),
  red: require(`${imagePathBlock}/red${ext}`),
  white: require(`${imagePathBlock}/white${ext}`),
  lightblue: require(`${imagePathBlock}/lightblue${ext}`),
  orange: require(`${imagePathBlock}/orange${ext}`),
  yellow: require(`${imagePathBlock}/yellow${ext}`),
  pink: require(`${imagePathBlock}/pink${ext}`),
};

export const BLOCK_COLORS: BlockColor[] = [
  "blue",
  "green",
  "purple",
  "yellow",
  "red",
  "orange",
  "white",
  "pink",
];

/**
 * Get a block image asset by type and color
 */
export function getBlockAsset(color: BlockColor) {
  return BLOCKS[color];
}

/**
 * Get a random block color
 */
export function getRandomBlockColor(): BlockColor {
  return BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
}
