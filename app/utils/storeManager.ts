import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  HIGH_SCORE: "@tetris_high_score",
  HIGH_LINES: "@tetris_high_lines",
  HIGH_LEVEL: "@tetris_high_level",
  GAMES_PLAYED: "@tetris_games_played",
  TOTAL_SCORE: "@tetris_total_score",
  SOUND_ENABLED: "@tetris_sound_enabled",
  MUSIC_ENABLED: "@tetris_music_enabled",
  SOUND_VOLUME: "@tetris_sound_volume",
  MUSIC_VOLUME: "@tetris_music_volume",
  GAME_HISTORY: "@tetris_game_history",
};

export interface GameStats {
  highScore: number;
  highLines: number;
  highLevel: number;
  gamesPlayed: number;
  totalScore: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
}

export interface GameHistoryEntry {
  score: number;
  lines: number;
  level: number;
  timestamp: number;
}

class StorageManager {
  // Get high score
  async getHighScore(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
      return value !== null ? parseInt(value, 10) : 0;
    } catch (error) {
      console.error("Error getting high score:", error);
      return 0;
    }
  }

  // Save high score
  async saveHighScore(score: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
    } catch (error) {
      console.error("Error saving high score:", error);
    }
  }

  // Get all game stats
  async getGameStats(): Promise<GameStats> {
    try {
      const [highScore, highLines, highLevel, gamesPlayed, totalScore] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.HIGH_SCORE),
          AsyncStorage.getItem(STORAGE_KEYS.HIGH_LINES),
          AsyncStorage.getItem(STORAGE_KEYS.HIGH_LEVEL),
          AsyncStorage.getItem(STORAGE_KEYS.GAMES_PLAYED),
          AsyncStorage.getItem(STORAGE_KEYS.TOTAL_SCORE),
        ]);

      return {
        highScore: highScore ? parseInt(highScore, 10) : 0,
        highLines: highLines ? parseInt(highLines, 10) : 0,
        highLevel: highLevel ? parseInt(highLevel, 10) : 1,
        gamesPlayed: gamesPlayed ? parseInt(gamesPlayed, 10) : 0,
        totalScore: totalScore ? parseInt(totalScore, 10) : 0,
      };
    } catch (error) {
      console.error("Error getting game stats:", error);
      return {
        highScore: 0,
        highLines: 0,
        highLevel: 1,
        gamesPlayed: 0,
        totalScore: 0,
      };
    }
  }

  // Update game stats after a game ends
  async updateGameStats(
    score: number,
    lines: number,
    level: number
  ): Promise<void> {
    try {
      const currentStats = await this.getGameStats();

      const updates = [
        AsyncStorage.setItem(
          STORAGE_KEYS.GAMES_PLAYED,
          (currentStats.gamesPlayed + 1).toString()
        ),
        AsyncStorage.setItem(
          STORAGE_KEYS.TOTAL_SCORE,
          (currentStats.totalScore + score).toString()
        ),
      ];

      if (score > currentStats.highScore) {
        updates.push(
          AsyncStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString())
        );
      }

      if (lines > currentStats.highLines) {
        updates.push(
          AsyncStorage.setItem(STORAGE_KEYS.HIGH_LINES, lines.toString())
        );
      }

      if (level > currentStats.highLevel) {
        updates.push(
          AsyncStorage.setItem(STORAGE_KEYS.HIGH_LEVEL, level.toString())
        );
      }

      await Promise.all(updates);
      await this.addGameToHistory(score, lines, level);
    } catch (error) {
      console.error("Error updating game stats:", error);
    }
  }

  // Get game settings
  async getGameSettings(): Promise<GameSettings> {
    try {
      const [soundEnabled, musicEnabled, soundVolume, musicVolume] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SOUND_ENABLED),
          AsyncStorage.getItem(STORAGE_KEYS.MUSIC_ENABLED),
          AsyncStorage.getItem(STORAGE_KEYS.SOUND_VOLUME),
          AsyncStorage.getItem(STORAGE_KEYS.MUSIC_VOLUME),
        ]);

      return {
        soundEnabled: soundEnabled !== null ? soundEnabled === "true" : true,
        musicEnabled: musicEnabled !== null ? musicEnabled === "true" : true,
        soundVolume: soundVolume !== null ? parseFloat(soundVolume) : 1.0,
        musicVolume: musicVolume !== null ? parseFloat(musicVolume) : 1.0,
      };
    } catch (error) {
      console.error("Error getting game settings:", error);
      return {
        soundEnabled: true,
        musicEnabled: true,
        soundVolume: 1.0,
        musicVolume: 1.0,
      };
    }
  }

  // Save game settings
  async saveGameSettings(settings: GameSettings): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(
          STORAGE_KEYS.SOUND_ENABLED,
          settings.soundEnabled.toString()
        ),
        AsyncStorage.setItem(
          STORAGE_KEYS.MUSIC_ENABLED,
          settings.musicEnabled.toString()
        ),
        AsyncStorage.setItem(
          STORAGE_KEYS.SOUND_VOLUME,
          settings.soundVolume.toString()
        ),
        AsyncStorage.setItem(
          STORAGE_KEYS.MUSIC_VOLUME,
          settings.musicVolume.toString()
        ),
      ]);
    } catch (error) {
      console.error("Error saving game settings:", error);
    }
  }

  // Get game history (last 10 games)
  async getGameHistory(): Promise<GameHistoryEntry[]> {
    try {
      const history = await AsyncStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error("Error getting game history:", error);
      return [];
    }
  }

  // Add game to history
  async addGameToHistory(
    score: number,
    lines: number,
    level: number
  ): Promise<void> {
    try {
      const history = await this.getGameHistory();
      const newEntry: GameHistoryEntry = {
        score,
        lines,
        level,
        timestamp: Date.now(),
      };

      const updatedHistory = [newEntry, ...history].slice(0, 10); // Keep only last 10 games
      await AsyncStorage.setItem(
        STORAGE_KEYS.GAME_HISTORY,
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      console.error("Error adding game to history:", error);
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error("Error clearing all data:", error);
    }
  }

  // Clear only game stats (keep settings)
  async clearGameStats(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.HIGH_SCORE,
        STORAGE_KEYS.HIGH_LINES,
        STORAGE_KEYS.HIGH_LEVEL,
        STORAGE_KEYS.GAMES_PLAYED,
        STORAGE_KEYS.TOTAL_SCORE,
        STORAGE_KEYS.GAME_HISTORY,
      ]);
    } catch (error) {
      console.error("Error clearing game stats:", error);
    }
  }
}

export default new StorageManager();
