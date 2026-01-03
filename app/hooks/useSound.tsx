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

  const backgroundMusicRef = useRef<Audio.Sound | null>(null);
  const currentMusicRef = useRef<Musics | null>(null);
  const isInitializedRef = useRef(false);
  const isMusicLoadingRef = useRef(false);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        isInitializedRef.current = true;
      } catch (error) {
        console.error("Error setting up audio:", error);
      }
    };

    setupAudio();

    return () => {
      stopMusic();
    };
  }, []);

  // Update music volume when musicEnabled changes
  useEffect(() => {
    if (backgroundMusicRef.current) {
      const updateVolume = async () => {
        try {
          const status = await backgroundMusicRef.current!.getStatusAsync();
          if (status.isLoaded) {
            await backgroundMusicRef.current!.setVolumeAsync(
              musicEnabled ? musicVolume : 0
            );
          }
        } catch (error) {
          console.error("Error updating music volume:", error);
        }
      };
      updateVolume();
    }
  }, [musicEnabled, musicVolume]);

  const playMusic = async (music: Musics, loop: boolean = true) => {
    if (!isInitializedRef.current || isMusicLoadingRef.current) return;

    // Don't restart the same music
    if (currentMusicRef.current === music && backgroundMusicRef.current) {
      try {
        const status = await backgroundMusicRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          return; // Already playing this music
        }
      } catch (error) {
        console.log("Sound not loaded, loading new music");
      }
    }

    try {
      isMusicLoadingRef.current = true;

      // Stop current music if playing
      if (backgroundMusicRef.current) {
        try {
          await backgroundMusicRef.current.stopAsync();
          await backgroundMusicRef.current.unloadAsync();
        } catch (e) {
          // Ignore errors during cleanup
        }
        backgroundMusicRef.current = null;
        currentMusicRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(musics[music], {
        isLooping: loop,
        volume: musicEnabled ? musicVolume : 0,
        shouldPlay: true,
      });

      backgroundMusicRef.current = sound;
      currentMusicRef.current = music;
      isMusicLoadingRef.current = false;
    } catch (error) {
      console.error("Error playing music:", error);
      currentMusicRef.current = null;
      isMusicLoadingRef.current = false;
    }
  };

  const stopMusic = async () => {
    if (backgroundMusicRef.current) {
      try {
        await backgroundMusicRef.current.stopAsync();
        await backgroundMusicRef.current.unloadAsync();
      } catch (error) {
        // Ignore errors during cleanup
      }
      backgroundMusicRef.current = null;
      currentMusicRef.current = null;
    }
  };

  const pauseMusic = async () => {
    if (backgroundMusicRef.current) {
      try {
        const status = await backgroundMusicRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await backgroundMusicRef.current.pauseAsync();
        }
      } catch (error) {
        console.error("Error pausing music:", error);
      }
    }
  };

  const resumeMusic = async () => {
    if (backgroundMusicRef.current) {
      try {
        const status = await backgroundMusicRef.current.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          await backgroundMusicRef.current.playAsync();
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

      const { sound } = await Audio.Sound.createAsync(soundEffects[effect], {
        volume: sfxVolume,
        shouldPlay: true,
      });

      // Auto-cleanup after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
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

      const { sound } = await Audio.Sound.createAsync(COMBO[combo], {
        volume: sfxVolume,
        shouldPlay: true,
      });

      // Auto-cleanup after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch (error) {
      // Silently fail
    }
  };

  const setMusicVolumeLevel = async (volume: number) => {
    setMusicVolume(volume);
    if (backgroundMusicRef.current) {
      try {
        const status = await backgroundMusicRef.current.getStatusAsync();
        if (status.isLoaded) {
          await backgroundMusicRef.current.setVolumeAsync(
            musicEnabled && volume > 0 ? volume : 0
          );
        }
      } catch (error) {
        console.error("Error setting music volume:", error);
      }
    }
  };

  const toggleMusicEnabled = (enabled: boolean) => {
    setMusicEnabled(enabled);
    if (backgroundMusicRef.current) {
      const updateVolume = async () => {
        try {
          const status = await backgroundMusicRef.current!.getStatusAsync();
          if (status.isLoaded) {
            await backgroundMusicRef.current!.setVolumeAsync(
              enabled ? musicVolume : 0
            );
          }
        } catch (error) {
          console.error("Error toggling music:", error);
        }
      };
      updateVolume();
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
