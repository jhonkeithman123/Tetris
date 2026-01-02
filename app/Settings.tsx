import Slider from "@react-native-community/slider";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

interface SettingsProps {
  onBack: () => void;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  onMusicToggle: (value: boolean) => void;
  onSfxToggle: (value: boolean) => void;
  onMusicVolumeChange: (value: number) => void;
  onSfxVolumeChange: (value: number) => void;
}

export default function Settings({
  onBack,
  musicEnabled,
  sfxEnabled,
  musicVolume,
  sfxVolume,
  onMusicToggle,
  onSfxToggle,
  onMusicVolumeChange,
  onSfxVolumeChange,
}: SettingsProps) {
  const [backPressed, setBackPressed] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>SETTINGS</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio</Text>

          {/* Music Toggle */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Background Music</Text>
            <Switch
              value={musicEnabled}
              onValueChange={onMusicToggle}
              trackColor={{ false: "#555", true: "#3498db" }}
              thumbColor={musicEnabled ? "#ffffff" : "#cccccc"}
            />
          </View>

          {/* Music Volume */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Music Volume</Text>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={musicVolume}
                onValueChange={onMusicVolumeChange}
                minimumTrackTintColor="#3498db"
                maximumTrackTintColor="#555"
                thumbTintColor="#ffffff"
                disabled={!musicEnabled}
              />
              <Text style={styles.volumeText}>
                {Math.round(musicVolume * 100)}%
              </Text>
            </View>
          </View>

          {/* SFX Toggle */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sound Effects</Text>
            <Switch
              value={sfxEnabled}
              onValueChange={onSfxToggle}
              trackColor={{ false: "#555", true: "#3498db" }}
              thumbColor={sfxEnabled ? "#ffffff" : "#cccccc"}
            />
          </View>

          {/* SFX Volume */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>SFX Volume</Text>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={sfxVolume}
                onValueChange={onSfxVolumeChange}
                minimumTrackTintColor="#3498db"
                maximumTrackTintColor="#555"
                thumbTintColor="#ffffff"
                disabled={!sfxEnabled}
              />
              <Text style={styles.volumeText}>
                {Math.round(sfxVolume * 100)}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>Tetris Game v1.0</Text>
          <Text style={styles.aboutText}>Built with React Native</Text>
        </View>

        {/* Back Button */}
        <Pressable
          onPressIn={() => setBackPressed(true)}
          onPressOut={() => setBackPressed(false)}
          onPress={onBack}
          style={styles.backButtonContainer}
        >
          <Image
            source={
              backPressed
                ? require("@/assets/images/buttons/menu/Touched.png")
                : require("@/assets/images/buttons/menu/Default.png")
            }
            style={styles.backButton}
            resizeMode="contain"
          />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0b",
  },
  scrollContent: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#3498db",
    letterSpacing: 4,
    marginBottom: 40,
  },
  section: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#3498db",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 20,
  },
  settingRow: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 8,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  volumeText: {
    fontSize: 14,
    color: "#ffffff",
    width: 45,
    textAlign: "right",
  },
  aboutText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 8,
  },
  backButtonContainer: {
    marginTop: 20,
  },
  backButton: {
    width: 150,
    height: 50,
  },
});
