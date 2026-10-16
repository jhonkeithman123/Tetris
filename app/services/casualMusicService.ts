import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { musics, Musics } from "@/app/utils/soundAssets";

export const LATEST_MUSIC_STORAGE_KEY = "@tetris_latest_played_music";

export async function checkInternetConnection(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://clients3.google.com/generate_204", {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.status === 204 || res.ok;
  } catch (e) {
    return false;
  }
}

export interface JukeboxStation {
  id: string;
  name: string;
  tag: string;
  description: string;
  category: "local" | "stream" | "yt";
  localKey?: Musics;
  streamUrl?: string;
  icon: string;
}

export interface YTMusicTrack {
  id: string;
  title: string;
  uploaderName: string;
  duration?: number;
  thumbnail?: string;
  audioUrl?: string;
}

export const RETAIN_IN_GAME_STORAGE_KEY = "@tetris_retain_jukebox_in_game";

export interface JukeboxState {
  currentStationId: string;
  currentTrack: JukeboxStation | null;
  queue: JukeboxStation[];
  isPlaying: boolean;
  activeTrackTitle: string;
  activeTrackArtist: string;
  volume: number;
  isLoading: boolean;
  retainInGame: boolean;
  activeYouTubeVideoId: string | null;
}

// Local music files found in assets/sounds/music
export const LOCAL_TRACKS: JukeboxStation[] = [
  {
    id: "local_menu",
    name: "Classic Menu Theme",
    tag: "📁 LOCAL",
    description: "sound_track.mp3 • Original Title Soundtrack",
    category: "local",
    localKey: "sound_track",
    icon: "🎵",
  },
  {
    id: "local_game",
    name: "Classic Arcade Theme",
    tag: "📁 LOCAL",
    description: "game_sound.mp3 • Fast-Paced In-Game Theme",
    category: "local",
    localKey: "game_sound",
    icon: "🕹️",
  },
];

// Online chill streams
export const CHILL_STATIONS: JukeboxStation[] = [
  {
    id: "lofi",
    name: "Lo-Fi Chill Beats",
    tag: "☕ STREAM",
    description: "Mellow relaxing study & chill beats",
    category: "stream",
    streamUrl: "https://ice1.somafm.com/groovesalad-128-mp3",
    icon: "☕",
  },
  {
    id: "synthwave",
    name: "Synthwave Sunset",
    tag: "🌴 STREAM",
    description: "80s neon arcade synth & chillwave",
    category: "stream",
    streamUrl: "https://ice2.somafm.com/vaporwaves-128-mp3",
    icon: "🌴",
  },
  {
    id: "cafe",
    name: "Cozy Cafe Jazz",
    tag: "🎹 STREAM",
    description: "Piano jazz & coffee shop acoustics",
    category: "stream",
    streamUrl: "https://ice1.somafm.com/illstreet-128-mp3",
    icon: "🎹",
  },
  {
    id: "ambient",
    name: "Deep Ambient Space",
    tag: "🎧 STREAM",
    description: "Tranquil atmospheric electronic calm",
    category: "stream",
    streamUrl: "https://ice1.somafm.com/spacestation-128-mp3",
    icon: "🎧",
  },
];

export const ALL_JUKEBOX_TRACKS: JukeboxStation[] = [
  ...LOCAL_TRACKS,
  ...CHILL_STATIONS,
];

class CasualMusicService {
  // THE SINGLE AND ONLY ACTIVE BACKGROUND MUSIC INSTANCE IN THE APP
  private sound: Audio.Sound | null = null;
  private playRequestId: number = 0;
  private listeners: Set<(state: JukeboxState) => void> = new Set();

  private state: JukeboxState = {
    currentStationId: "local_menu",
    currentTrack: LOCAL_TRACKS[0],
    queue: [],
    isPlaying: false,
    activeTrackTitle: "Classic Menu Theme",
    activeTrackArtist: "📁 LOCAL",
    volume: 0.5,
    isLoading: false,
    retainInGame: true,
    activeYouTubeVideoId: null,
  };

  getState(): JukeboxState {
    return {
      ...this.state,
      queue: [...this.state.queue],
    };
  }

  subscribe(listener: (state: JukeboxState) => void) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((l) => {
      try {
        l(s);
      } catch (e) {
        // ignore listener error
      }
    });
  }

  /**
   * Immediately stops any playing music and starts playing the given track.
   * If there was any playing song, it is immediately terminated.
   */
  async playNow(station: JukeboxStation) {
    const reqId = ++this.playRequestId;

    // 1. Immediately detach and unload any existing sound object
    if (this.sound) {
      const oldSound = this.sound;
      this.sound = null; // Detach immediately to prevent race conditions
      try {
        await oldSound.stopAsync();
        await oldSound.unloadAsync();
      } catch (e) {
        // ignore
      }
    }

    if (reqId !== this.playRequestId) return;

    this.state.currentStationId = station.id;
    this.state.currentTrack = station;
    this.state.activeTrackTitle = station.name;
    this.state.activeTrackArtist = station.tag;
    this.state.isLoading = true;

    // Seamless YouTube background audio playback (plays audio of any YouTube video without rendering video)
    if (station.category === "yt") {
      const videoId = station.id.replace("yt_", "");
      this.state.activeYouTubeVideoId = videoId;
      this.state.isPlaying = true;
      this.notify();

      // Persist latest played YouTube music track
      try {
        AsyncStorage.setItem(
          LATEST_MUSIC_STORAGE_KEY,
          JSON.stringify(station)
        ).catch(() => {});
      } catch (e) {
        // ignore
      }
      return;
    }

    // When switching to local audio or custom stream, detach active YouTube player
    if (this.state.activeYouTubeVideoId) {
      this.state.activeYouTubeVideoId = null;
    }

    this.notify();

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      let source;
      if (station.category === "local" && station.localKey) {
        source = musics[station.localKey];
      } else if (station.streamUrl) {
        source = { uri: station.streamUrl };
      }

      if (!source) {
        this.state.isLoading = false;
        this.notify();
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          shouldPlay: true,
          isLooping: this.state.queue.length === 0, // loop if queue is empty
          volume: this.state.volume,
        }
      );

      // Race condition check: if another track was requested while loading, discard this one
      if (reqId !== this.playRequestId) {
        await sound.unloadAsync().catch(() => {});
        return;
      }

      this.sound = sound;
      this.state.isPlaying = true;
      this.state.isLoading = false;
      this.notify();

      // Persist latest successfully played track to local storage for next startup
      try {
        AsyncStorage.setItem(
          LATEST_MUSIC_STORAGE_KEY,
          JSON.stringify(station)
        ).catch(() => {});
      } catch (e) {
        // ignore
      }

      this.sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (this.state.isPlaying !== status.isPlaying) {
            this.state.isPlaying = status.isPlaying;
            this.notify();
          }

          // If track finished naturally and we have items in the queue, advance queue
          if (status.didJustFinish && this.state.queue.length > 0) {
            this.playNext();
          }
        }
      });
    } catch (error) {
      console.warn("[MusicQueue] Failed to play track:", error);
      if (reqId === this.playRequestId) {
        this.state.isPlaying = false;
        this.state.isLoading = false;
        this.notify();
      }
    }
  }

  /**
   * Load and resume latest played track from storage on app launch.
   * If offline or if the online stream cannot be reached, automatically defaults to local music.
   */
  async initializeStartupMusic() {
    try {
      // Restore user's retainInGame preference
      const savedRetain = await AsyncStorage.getItem(RETAIN_IN_GAME_STORAGE_KEY);
      if (savedRetain !== null) {
        this.state.retainInGame = JSON.parse(savedRetain);
        this.notify();
      }

      const savedJson = await AsyncStorage.getItem(LATEST_MUSIC_STORAGE_KEY);
      if (savedJson) {
        const savedTrack: JukeboxStation = JSON.parse(savedJson);

        if (savedTrack.category === "local") {
          // Local track plays unconditionally without internet
          await this.playNow(savedTrack);
          return;
        }

        // For online streams & YouTube Music: check if internet connection is alive
        const isOnline = await checkInternetConnection();
        if (isOnline) {
          await this.playNow(savedTrack);
          return;
        } else {
          console.log(
            "[MusicQueue] Offline detected, falling back to local soundtrack"
          );
        }
      }
    } catch (e) {
      console.warn("[MusicQueue] Failed restoring startup music:", e);
    }

    // Default to Classic Menu Theme if offline or no saved track
    await this.playNow(LOCAL_TRACKS[0]);
  }

  /**
   * Update whether Jukebox music should continue playing when entering Tetris game
   */
  async setRetainInGame(retain: boolean) {
    this.state.retainInGame = retain;
    this.notify();
    try {
      await AsyncStorage.setItem(
        RETAIN_IN_GAME_STORAGE_KEY,
        JSON.stringify(retain)
      );
    } catch (e) {
      // ignore
    }
  }

  /**
   * Set station by ID (calls playNow)
   */
  async setStation(stationId: string) {
    const station = ALL_JUKEBOX_TRACKS.find((s) => s.id === stationId);
    if (station) {
      await this.playNow(station);
    }
  }

  /**
   * Add a track to the upcoming queue.
   * If nothing is currently playing, starts it immediately.
   */
  async addToQueue(station: JukeboxStation) {
    if (!this.state.isPlaying && !this.sound) {
      await this.playNow(station);
      return;
    }
    this.state.queue = [...this.state.queue, station];
    this.notify();
  }

  /**
   * Skip to the next track in the queue.
   */
  async playNext() {
    if (this.state.queue.length === 0) {
      return;
    }
    const [nextTrack, ...remaining] = this.state.queue;
    this.state.queue = remaining;
    this.notify();
    await this.playNow(nextTrack);
  }

  /**
   * Remove a track at index from the queue.
   */
  removeFromQueue(index: number) {
    this.state.queue = this.state.queue.filter((_, i) => i !== index);
    this.notify();
  }

  /**
   * Clear the entire upcoming queue.
   */
  clearQueue() {
    this.state.queue = [];
    this.notify();
  }

  /**
   * Move queue item up or down.
   */
  moveQueueItem(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= this.state.queue.length) return;
    const item = this.state.queue[fromIndex];
    const newQueue = [...this.state.queue];
    newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, item);
    this.state.queue = newQueue;
    this.notify();
  }

  /**
   * Play any raw stream URL (e.g. YouTube stream) immediately
   */
  async playStreamUrl(url: string, title: string, artist: string) {
    const track: JukeboxStation = {
      id: `custom_${Date.now()}`,
      name: title,
      tag: artist,
      description: "Custom Stream",
      category: "stream",
      streamUrl: url,
      icon: "🌐",
    };
    await this.playNow(track);
  }

  /**
   * Pause or resume current audio
   */
  async togglePlay() {
    if (this.state.activeYouTubeVideoId) {
      this.state.isPlaying = !this.state.isPlaying;
      this.notify();
      return;
    }

    if (!this.sound) {
      if (this.state.currentTrack) {
        await this.playNow(this.state.currentTrack);
      }
      return;
    }

    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await this.sound.pauseAsync();
          this.state.isPlaying = false;
        } else {
          await this.sound.playAsync();
          this.state.isPlaying = true;
        }
        this.notify();
      }
    } catch (e) {
      console.warn("[MusicQueue] Error toggling playback:", e);
    }
  }

  /**
   * Stop and unload current audio immediately
   */
  async stop() {
    this.playRequestId++; // Invalidate any pending load requests
    if (this.state.activeYouTubeVideoId) {
      this.state.activeYouTubeVideoId = null;
    }
    if (this.sound) {
      const s = this.sound;
      this.sound = null;
      try {
        await s.stopAsync();
        await s.unloadAsync();
      } catch (e) {
        // ignore
      }
    }
    this.state.isPlaying = false;
    this.state.isLoading = false;
    this.notify();
  }

  /**
   * Set playback volume (0.0 to 1.0)
   */
  async setVolume(volume: number) {
    this.state.volume = Math.max(0, Math.min(1, volume));
    if (this.sound) {
      await this.sound.setVolumeAsync(this.state.volume).catch(() => {});
    }
    this.notify();
  }

  /**
   * Unofficial YouTube Music / YouTube track search
   * Uses direct YouTube Music Innertube API (WEB_REMIX) with fallback to YouTube Innertube API (WEB).
   */
  async searchYTMusic(queryText: string): Promise<YTMusicTrack[]> {
    const q = queryText.trim();
    if (!q) return [];

    // Attempt 1: YouTube Music Innertube API (Official WEB_REMIX client)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch("https://music.youtube.com/youtubei/v1/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://music.youtube.com/",
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB_REMIX",
              clientVersion: "1.20240101.01.00",
              hl: "en",
              gl: "US",
            },
          },
          query: q,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: any = await res.json();
        const sectionList =
          data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer
            ?.content?.sectionListRenderer?.contents || [];
        const results: YTMusicTrack[] = [];
        const seenIds = new Set<string>();

        for (const section of sectionList) {
          // Top card result (artist, top hit, album)
          if (section.musicCardShelfRenderer) {
            const card = section.musicCardShelfRenderer;
            const cardTitle =
              card.title?.runs?.map((r: any) => r.text).join("") || "";
            const cardSubtitle =
              card.subtitle?.runs?.map((r: any) => r.text).join("") || "";
            const cardVideoId =
              card.title?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId ||
              card.buttons?.find(
                (b: any) => b.buttonRenderer?.command?.watchEndpoint
              )?.buttonRenderer?.command?.watchEndpoint?.videoId;
            const cardThumb =
              card.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(
                -1
              )[0]?.url;

            if (cardVideoId && !seenIds.has(cardVideoId)) {
              seenIds.add(cardVideoId);
              const parts = cardSubtitle.split("•").map((p: string) => p.trim());
              let artist = "YouTube Music";
              if (parts.length > 1) {
                artist = ["song", "video", "album", "single"].includes(
                  parts[0].toLowerCase()
                )
                  ? parts[1]
                  : parts[0];
              } else if (parts[0]) {
                artist = parts[0];
              }

              results.push({
                id: cardVideoId,
                title: cardTitle,
                uploaderName: artist,
                duration: 180,
                thumbnail: cardThumb,
              });
            }
          }

          // Section items
          const items =
            section.itemSectionRenderer?.contents ||
            section.musicShelfRenderer?.contents ||
            [];
          for (const it of items) {
            const r = it.musicResponsiveListItemRenderer;
            if (!r) continue;

            const flexCols = r.flexColumns || [];
            const titleRuns =
              flexCols[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
            const subtitleRuns =
              flexCols[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
            const title =
              titleRuns
                ?.map((x: any) => x.text)
                .join("")
                .trim() || "";
            const subtitle =
              subtitleRuns
                ?.map((x: any) => x.text)
                .join("")
                .trim() || "";

            const playEndpoint =
              r.overlay?.musicItemThumbnailOverlayRenderer?.content
                ?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint;
            const navEndpoint = r.navigationEndpoint?.watchEndpoint;
            const flexEndpoint =
              titleRuns?.[0]?.navigationEndpoint?.watchEndpoint;
            const videoId =
              playEndpoint?.videoId ||
              navEndpoint?.videoId ||
              flexEndpoint?.videoId;

            const thumbs =
              r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
            const thumb =
              thumbs.length > 0 ? thumbs[thumbs.length - 1].url : undefined;

            if (videoId && title && !seenIds.has(videoId)) {
              seenIds.add(videoId);
              const parts = subtitle.split("•").map((p: string) => p.trim());
              let artist = "YouTube Music";
              if (parts.length > 1) {
                artist = ["song", "video", "album", "single"].includes(
                  parts[0].toLowerCase()
                )
                  ? parts[1]
                  : parts[0];
              } else if (parts[0]) {
                artist = parts[0];
              }

              results.push({
                id: videoId,
                title,
                uploaderName: artist,
                duration: 180,
                thumbnail: thumb,
              });
            }
          }
        }

        if (results.length > 0) {
          return results.slice(0, 15);
        }
      }
    } catch (e) {
      // fallback to standard YouTube search
    }

    // Attempt 2: Standard YouTube Innertube API (WEB)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch("https://www.youtube.com/youtubei/v1/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20240101.01.00",
              hl: "en",
              gl: "US",
            },
          },
          query: q,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: any = await res.json();
        const sections =
          data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
            ?.sectionListRenderer?.contents || [];
        const results: YTMusicTrack[] = [];
        const seenIds = new Set<string>();

        for (const sec of sections) {
          const items = sec.itemSectionRenderer?.contents || [];
          for (const item of items) {
            const v = item.videoRenderer;
            if (v && v.videoId && !seenIds.has(v.videoId)) {
              seenIds.add(v.videoId);
              const title =
                v.title?.runs?.map((r: any) => r.text).join("") ||
                v.title?.simpleText ||
                "Track";
              const uploader =
                v.ownerText?.runs?.map((r: any) => r.text).join("") ||
                v.shortBylineText?.runs?.map((r: any) => r.text).join("") ||
                "YouTube";
              const thumb = v.thumbnail?.thumbnails?.slice(-1)[0]?.url;
              results.push({
                id: v.videoId,
                title,
                uploaderName: uploader,
                duration: 180,
                thumbnail: thumb,
              });
            }
          }
        }
        if (results.length > 0) {
          return results.slice(0, 15);
        }
      }
    } catch (e) {
      // ignore
    }

    return [];
  }

  /**
   * Resolve an audio stream for a YouTube video ID
   */
  async resolveAudioStream(videoId: string): Promise<string | null> {
    const streamSources = [
      `https://invidious.f5.si/latest_version?id=${videoId}&itag=140`,
      `https://yewtu.be/latest_version?id=${videoId}&itag=140`,
      `https://iv.ggtyler.dev/latest_version?id=${videoId}&itag=140`,
      `https://invidious.nerdvpn.de/latest_version?id=${videoId}&itag=140`,
      `https://invidious.f5.si/latest_version?id=${videoId}&itag=251`,
      `https://yewtu.be/latest_version?id=${videoId}&itag=251`,
      `https://invidious.f5.si/latest_version?id=${videoId}&itag=18`,
    ];

    for (const endpoint of streamSources) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(endpoint, {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.status === 200 || res.status === 206 || res.status === 302) {
          return endpoint;
        }
      } catch (e) {
        // try next endpoint
      }
    }

    // Default to the first candidate as best-effort
    return streamSources[0];
  }

  /**
   * Fetch autocomplete suggestions for a query
   */
  async getSearchSuggestions(queryText: string): Promise<string[]> {
    const q = queryText.trim();
    if (!q) return [];
    try {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[1])) {
        return data[1].slice(0, 6) as string[];
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  /**
   * Receive playback events from the background YouTube audio player
   */
  notifyYouTubeState(
    event: "playing" | "paused" | "buffering" | "ended" | "error" | "ready"
  ) {
    if (event === "playing") {
      this.state.isPlaying = true;
      this.state.isLoading = false;
      this.notify();
    } else if (event === "paused") {
      this.state.isPlaying = false;
      this.notify();
    } else if (event === "buffering") {
      this.state.isLoading = true;
      this.notify();
    } else if (event === "ended") {
      this.state.isPlaying = false;
      this.notify();
      if (this.state.queue.length > 0) {
        this.playNext();
      }
    } else if (event === "error") {
      this.state.isLoading = false;
      this.state.isPlaying = false;
      this.notify();
      if (this.state.queue.length > 0) {
        this.playNext();
      }
    }
  }

  /**
   * Play any YouTube video / music track as pure background audio without rendering video
   */
  async playYTMusicTrack(track: YTMusicTrack) {
    const station: JukeboxStation = {
      id: `yt_${track.id}`,
      name: track.title,
      tag: track.uploaderName || "YouTube",
      description: "YouTube Audio Stream",
      category: "yt",
      icon: "▶",
    };
    await this.playNow(station);
    return true;
  }
}

export const casualMusicService = new CasualMusicService();
