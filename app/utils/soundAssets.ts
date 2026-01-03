const soundPath = "@/assets/sounds";
const effects = "/effects";
const music = "/music";

const ext = ".mp3";

export type ComboSounds =
  | "combo1"
  | "combo2"
  | "combo3"
  | "combo4"
  | "combo5"
  | "combo6"
  | "combo7";

export type SoundEffects =
  | "disappear"
  | "hard_drop"
  | "spawn"
  | "rotate"
  | "swap"
  | "move"
  | "game_over"
  | "drop";

export type Musics = "game_sound" | "sound_track";

export const COMBO_SOUNDS: ComboSounds[] = [
  "combo1",
  "combo2",
  "combo3",
  "combo4",
  "combo5",
  "combo6",
  "combo7",
];

export const COMBO: Record<ComboSounds, any> = {
  combo1: require(`${soundPath}/${effects}/combo/combo1${ext}`),
  combo2: require(`${soundPath}/${effects}/combo/combo2${ext}`),
  combo3: require(`${soundPath}/${effects}/combo/combo3${ext}`),
  combo4: require(`${soundPath}/${effects}/combo/combo4${ext}`),
  combo5: require(`${soundPath}/${effects}/combo/combo5${ext}`),
  combo6: require(`${soundPath}/${effects}/combo/combo6${ext}`),
  combo7: require(`${soundPath}/${effects}/combo/combo7${ext}`),
};

export const SOUND_EFFECTS: SoundEffects[] = [
  "disappear",
  "hard_drop",
  "rotate",
  "spawn",
  "swap",
  "move",
  "game_over",
  "drop",
];

export const soundEffects: Record<SoundEffects, any> = {
  disappear: require(`${soundPath}/${effects}/disappear${ext}`),
  hard_drop: require(`${soundPath}/${effects}/hard_drop${ext}`),
  rotate: require(`${soundPath}/${effects}/rotate${ext}`),
  move: require(`${soundPath}/${effects}/move${ext}`),
  spawn: require(`${soundPath}/${effects}/spawn${ext}`),
  swap: require(`${soundPath}/${effects}/swap${ext}`),
  game_over: require(`${soundPath}/${effects}/game_over${ext}`),
  drop: require(`${soundPath}/${effects}/drop${ext}`),
};

export const MUSICS: Musics[] = ["game_sound", "sound_track"];

export const musics: Record<Musics, any> = {
  sound_track: require(`${soundPath}/${music}/sound_track${ext}`),
  game_sound: require(`${soundPath}/${music}/game_sound${ext}`),
};
