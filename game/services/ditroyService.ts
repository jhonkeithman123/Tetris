import { DitroyClient } from "@131fgh/ditroy-client";

export interface GameMetrics {
  score: number;
  level: number;
  lines: number;
  combo: number;
  stackHeight: number; // 0 to 20
  timeElapsed: number; // in seconds
}

export interface AdaptiveDifficultyState {
  isOnline: boolean;
  dropIntervalMs: number;
  difficultyTier: "relaxed" | "standard" | "expert" | "clutch";
  aiCommentary?: string;
  speedMultiplier: number;
}

class DitroyGameService {
  private client: DitroyClient;
  private isOnline: boolean = false;
  private lastHealthCheck: number = 0;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30s
  private conversationId: string | null = null;
  private lastAiCommentary: string = "";

  constructor() {
    // Initialize Ditroy Client
    this.client = new DitroyClient({
      baseUrl: "https://ditroy.onrender.com", // default or fallback public endpoint
      timeoutMs: 8000,
    });
    this.checkOnlineStatus();
  }

  /**
   * Check connection status to DITroy backend without blocking
   */
  public async checkOnlineStatus(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL && this.isOnline) {
      return this.isOnline;
    }

    try {
      this.lastHealthCheck = now;
      const health = await this.client.getHealth();
      this.isOnline = health.status === "healthy" || health.status === "degraded";
    } catch {
      // Offline or network unavailable
      this.isOnline = false;
    }

    return this.isOnline;
  }

  /**
   * Get dynamic drop interval and difficulty adjustment based on player metrics
   */
  public calculateAdaptiveDropInterval(metrics: GameMetrics): AdaptiveDifficultyState {
    const { level, combo, stackHeight, lines, timeElapsed } = metrics;

    // Standard base drop interval (local formula)
    // Level 1: 1000ms, Level 2: 900ms, ... minimum 80ms
    const baseInterval = Math.max(80, 1000 - (level - 1) * 90);

    let speedMultiplier = 1.0;
    let difficultyTier: AdaptiveDifficultyState["difficultyTier"] = "standard";

    // Adaptive logic when online
    if (this.isOnline) {
      const clearPace = timeElapsed > 0 ? (lines / (timeElapsed / 60)) : 0; // lines per minute

      // High combo & fast clear pace: Flow state / Expert mode (speeds up slightly)
      if (combo >= 3 || clearPace > 25) {
        speedMultiplier = 1.18;
        difficultyTier = "expert";
      }
      // Critical danger zone (stack height > 14 out of 20): Clutch mode
      else if (stackHeight >= 14) {
        speedMultiplier = 0.95; // subtle micro-relief for tactical clutch plays
        difficultyTier = "clutch";
      }
      // Early game / low difficulty
      else if (level <= 2 && combo === 0) {
        speedMultiplier = 0.95;
        difficultyTier = "relaxed";
      }
    }

    const calculatedInterval = Math.round(baseInterval / speedMultiplier);

    return {
      isOnline: this.isOnline,
      dropIntervalMs: calculatedInterval,
      difficultyTier,
      speedMultiplier,
      aiCommentary: this.lastAiCommentary,
    };
  }

  /**
   * Asynchronously fetch dynamic AI coach commentary on notable events (Tetris, high combo, Game Over)
   */
  public async requestEventCommentary(event: "tetris" | "high_combo" | "game_over" | "clutch_save", metrics: GameMetrics): Promise<string> {
    if (!this.isOnline) {
      return this.getLocalCommentary(event, metrics);
    }

    try {
      const prompt = `Short 1-sentence arcade commentary for Tetris player: event=${event}, score=${metrics.score}, level=${metrics.level}, combo=${metrics.combo}. Keep it punchy and energetic under 12 words.`;
      const response = await this.client.chat({
        message: prompt,
        conversationId: this.conversationId || undefined,
      });

      if (response && response.reply) {
        const cleaned = response.reply.replace(/["']/g, "").trim();
        this.lastAiCommentary = cleaned;
        return cleaned;
      }
    } catch {
      // Fallback on error
    }

    return this.getLocalCommentary(event, metrics);
  }

  private getLocalCommentary(event: string, metrics: GameMetrics): string {
    switch (event) {
      case "tetris":
        return "⚡ TETRIS! 4-line mastery!";
      case "high_combo":
        return `🔥 ${metrics.combo}x COMBO! Unstoppable!`;
      case "clutch_save":
        return "✨ Incredible clutch recovery!";
      case "game_over":
        return metrics.score > 10000 ? "🏆 Remarkable run!" : "🎮 Good effort! Play again?";
      default:
        return "";
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

export const ditroyService = new DitroyGameService();
export default ditroyService;
