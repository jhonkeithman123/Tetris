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

import {
  casualMusicService,
  LOCAL_TRACKS,
} from "@/app/services/casualMusicService";

export default function useSound() {
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.7);

  const isInitializedRef = useRef(false);
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
    };
  }, []);

  const playMusic = async (music: Musics) => {
    if (!musicEnabled) return;
    const station = LOCAL_TRACKS.find((s) => s.localKey === music);
    if (station) {
      await casualMusicService.playNow(station);
    }
  };

  const stopMusic = async () => {
    await casualMusicService.stop();
  };

  const pauseMusic = async () => {
    await casualMusicService.togglePlay();
  };

  const resumeMusic = async () => {
    await casualMusicService.togglePlay();
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
    await casualMusicService.setVolume(musicEnabled && volume > 0 ? volume : 0);
  };

  const toggleMusicEnabled = async (enabled: boolean) => {
    setMusicEnabled(enabled);
    await casualMusicService.setVolume(enabled ? musicVolume : 0);
    if (!enabled) {
      await casualMusicService.stop();
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
