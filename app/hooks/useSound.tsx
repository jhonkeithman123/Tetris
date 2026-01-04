import {
  COMBO,
  ComboSounds,
  Musics,
  musics,
  soundEffects,
  SoundEffects,
} from "@/app/utils/soundAssets";
import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";

export default function useSound() {
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.7);

  const musicPlayerRef = useRef<Audio.Sound | null>(null);
  const currentMusicRef = useRef<Musics | null>(null);
  const isInitializedRef = useRef(false);
  const isMusicLoadingRef = useRef(false);
  const soundEffectsPoolRef = useRef<Map<string, Audio.Sound>>(new Map());

  useEffect(() => {
    isInitializedRef.current = true;

    return () => {
      // Cleanup sound effects
      soundEffectsPoolRef.current.forEach(async (sound) => {
        try {
          await sound.unloadAsync();
        } catch (e) {
          // Ignore cleanup errors
        }
      });
      soundEffectsPoolRef.current.clear();

      // Cleanup music
      if (musicPlayerRef.current) {
        try {
          musicPlayerRef.current.unloadAsync();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const playMusic = async (music: Musics, loop: boolean = true) => {
    if (!isInitializedRef.current || isMusicLoadingRef.current) return;

    // Don't restart the same music if already playing
    if (currentMusicRef.current === music && musicPlayerRef.current) {
      try {
        const status = await musicPlayerRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          return;
        }
      } catch (error) {
        console.log("Music player error, reloading");
      }
    }

    try {
      isMusicLoadingRef.current = true;

      // Unload previous music
      if (musicPlayerRef.current) {
        await musicPlayerRef.current.unloadAsync();
        musicPlayerRef.current = null;
      }

      // Load and play new music
      const { sound } = await Audio.Sound.createAsync(musics[music], {
        shouldPlay: true,
        isLooping: loop,
        volume: musicEnabled ? musicVolume : 0,
      });

      musicPlayerRef.current = sound;
      currentMusicRef.current = music;
      isMusicLoadingRef.current = false;
    } catch (error) {
      console.error("Error playing music:", error);
      currentMusicRef.current = null;
      isMusicLoadingRef.current = false;
    }
  };

  const stopMusic = async () => {
    if (musicPlayerRef.current) {
      try {
        await musicPlayerRef.current.stopAsync();
        await musicPlayerRef.current.setPositionAsync(0);
      } catch (error) {
        // Ignore errors during cleanup
      }
      currentMusicRef.current = null;
    }
  };

  const pauseMusic = async () => {
    if (musicPlayerRef.current) {
      try {
        const status = await musicPlayerRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await musicPlayerRef.current.pauseAsync();
        }
      } catch (error) {
        console.error("Error pausing music:", error);
      }
    }
  };

  const resumeMusic = async () => {
    if (musicPlayerRef.current) {
      try {
        const status = await musicPlayerRef.current.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          await musicPlayerRef.current.playAsync();
        }
      } catch (error) {
        console.error("Error resuming music:", error);
      }
    }
  };

  const playEffect = async (effect: SoundEffects) => {
    if (!sfxEnabled || !isInitializedRef.current || sfxVolume === 0) return;

    try {
      if (!soundEffects[effect]) {
        return;
      }

      // Check if we have a cached sound effect
      const cachedSound = soundEffectsPoolRef.current.get(effect);
      if (cachedSound) {
        try {
          // Replay from beginning
          await cachedSound.setPositionAsync(0);
          await cachedSound.setVolumeAsync(sfxVolume);
          await cachedSound.playAsync();
          return;
        } catch (e) {
          // Sound might be in bad state, remove from pool
          soundEffectsPoolRef.current.delete(effect);
          try {
            await cachedSound.unloadAsync();
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
        }
      }

      // Create new sound
      const { sound } = await Audio.Sound.createAsync(soundEffects[effect], {
        shouldPlay: true,
        volume: sfxVolume,
      });

      // Add to pool for reuse
      soundEffectsPoolRef.current.set(effect, sound);
    } catch (error) {
      // Silently fail for missing or invalid sound files
    }
  };

  const playCombo = async (combo: ComboSounds) => {
    if (!sfxEnabled || !isInitializedRef.current || sfxVolume === 0) return;

    try {
      if (!COMBO[combo]) {
        return;
      }

      // Create one-time sound for combo sounds
      const { sound } = await Audio.Sound.createAsync(COMBO[combo], {
        shouldPlay: true,
        volume: sfxVolume,
      });

      // Auto-cleanup when finished
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      // Silently fail
    }
  };

  const setMusicVolumeLevel = async (volume: number) => {
    setMusicVolume(volume);
    if (musicPlayerRef.current) {
      try {
        await musicPlayerRef.current.setVolumeAsync(
          musicEnabled && volume > 0 ? volume : 0
        );
      } catch (error) {
        console.error("Error setting music volume:", error);
      }
    }
  };

  const toggleMusicEnabled = async (enabled: boolean) => {
    setMusicEnabled(enabled);
    if (musicPlayerRef.current) {
      try {
        await musicPlayerRef.current.setVolumeAsync(enabled ? musicVolume : 0);
      } catch (error) {
        console.error("Error toggling music:", error);
      }
    }
  };

  return {
    musicEnabled,
    sfxEnabled,
    musicVolume,
    sfxVolume,
    setMusicEnabled: toggleMusicEnabled,
    setSfxEnabled,
    setMusicVolume: setMusicVolumeLevel,
    setSfxVolume,
    playMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    playEffect,
    playCombo,
  };
}
