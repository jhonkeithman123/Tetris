import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CURRENT_VERSION } from "./components/BurgerMenu";

interface PatchNotesProps {
  onBack: () => void;
}

const CHANGELOG = `
# Tetris Game - Change Log

## [${CURRENT_VERSION}] - 2026-01-04

### Visual Enhancements

- **Ghost Piece Preview**
  - Added colored outline showing exactly where blocks will land
  - Unique colors for each block type for easy identification
  - Real-time position updates as piece moves or rotates

- **Motion Blur Animation**
  - Stunning trail effect when using hard drop
  - Multiple blur lines with varying opacity and thickness
  - Glowing effect that follows the falling piece
  - Smooth 60fps animation using native driver

- **Second Next Piece Preview**
  - Display the next 2 upcoming pieces
  - Helps with strategic planning

### Gameplay Improvements

- **New Block Types**
  - Diagonal Block: 3x3 diagonal pattern (rare)
  - Reverse Diagonal Block: Mirrored diagonal (rare)
  - Straight Z Block: Extended Z-shape, 4 cells wide (uncommon)
  - Reverse Straight Z Block: Mirrored straight Z (uncommon)
  - Long L Block: 5-cell L-shape (very rare)
  - Reverse Long L Block: Mirrored long L (very rare)

- **Weighted Block Spawning**
  - Classic pieces spawn 85-90% of the time
  - Special pieces are uncommon to rare
  - Cross block remains super rare (1% spawn rate)

- **Enhanced Hard Drop**
  - Instant piece placement without snap-back bug
  - Smooth animation completion before next piece spawns
  - Motion blur visual feedback

### Controls Update

- **Redesigned Layout**
  - Separated right-side controls for better accessibility
  - Increased spacing between D-pad buttons

- **Improved Responsiveness**
  - Visual feedback for all button presses
  - Continuous hold support for movement and rotation

### Technical Improvements

- **Audio System Migration**
  - Migrated from deprecated expo-av to expo-audio
  - Improved audio performance with AudioPlayer API
  - Better sound effect pooling and reusability
  - Reduced memory footprint for audio playback

- **Keep-Awake Functionality**
  - Screen stays on during active gameplay
  - Automatically deactivates when paused or in menu
  - Graceful error handling for device compatibility

- **Metro Bundler Optimization**
  - Fixed symlink resolution issues
  - Improved module path handling

- **Performance**
  - Native driver for all animations (60fps)
  - Optimized rendering for ghost piece
  - Enhanced audio playback efficiency

### User Interface

- **Patch Notes Screen**
  - Accessible from burger menu
  - Detailed version history
  - Clean, organized layout

- **Updated Help Screen**
  - Documented ghost piece feature
  - Explained motion blur animation
  - Added all new block types

### Bug Fixes

- Fixed piece snapping back after hard drop placement
- Resolved ghost piece color matching real piece
- Fixed Metro bundler path resolution errors
- Corrected block spawning probability calculations
- Eliminated "wrong thread" audio errors
- Fixed keep-awake unhandled promise rejections

---

## [1.0.0] - 2026-01-02

### Core Gameplay
- Classic Tetris mechanics with 7 piece types + special cross block
- Full piece rotation with wall kick support
- Hard drop functionality for instant piece placement
- Hold/swap piece feature to save pieces for later use

### Scoring System
- Dynamic scoring based on lines cleared and current level
- Line multipliers: 1-4 lines with level multiplier
- High score tracking with persistent storage

### Combo System
- Consecutive line clear combo multiplier (up to 7x)
- Combo bonus: +10 points × combo count
- 6-second combo timer
- Combo sound effects and visual feedback

### Audio System
- Background game music
- Sound effects for all actions
- Adjustable music and SFX volume controls

### Settings & Storage
- Persistent settings storage (AsyncStorage)
- Game statistics tracking
- Game history (last 10 games)
`;

// Simple markdown parser for the changelog
const parseChangelog = (markdown: string) => {
  const lines = markdown.trim().split("\n");
  const sections: any[] = [];
  let currentVersion: any = null;
  let currentCategory: any = null;

  lines.forEach((line) => {
    // Version header (## [1.1.0] - Date)
    if (line.startsWith("## [")) {
      if (currentVersion) sections.push(currentVersion);
      const versionMatch = line.match(/\[([^\]]+)\]\s*-\s*(.+)/);
      currentVersion = {
        version: versionMatch?.[1] || "",
        date: versionMatch?.[2] || "",
        categories: [],
      };
      currentCategory = null;
    }
    // Category header (### Category Name)
    else if (line.startsWith("### ")) {
      if (currentVersion) {
        currentCategory = {
          title: line.replace("### ", ""),
          items: [],
        };
        currentVersion.categories.push(currentCategory);
      }
    }
    // Bullet point
    else if (line.startsWith("- ") && currentCategory) {
      currentCategory.items.push(line.replace("- ", ""));
    }
    // Sub-bullet point
    else if (line.trim().startsWith("- ") && currentCategory) {
      currentCategory.items.push("  " + line.trim().replace("- ", ""));
    }
  });

  if (currentVersion) sections.push(currentVersion);
  return sections;
};

export default function PatchNotes({ onBack }: PatchNotesProps) {
  const [backPressed, setBackPressed] = useState(false);
  const versions = parseChangelog(CHANGELOG);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>PATCH NOTES</Text>

        {versions.map((version, vIndex) => (
          <View key={vIndex} style={styles.versionSection}>
            <Text style={styles.versionTitle}>
              Version {version.version} {vIndex === 0 ? "- Latest" : ""}
            </Text>
            <Text style={styles.versionDate}>{version.date}</Text>

            {version.categories.map((category: any, cIndex: number) => (
              <View key={cIndex} style={styles.section}>
                <Text style={styles.sectionTitle}>{category.title}</Text>
                {category.items.map((item: string, iIndex: number) => (
                  <Text key={iIndex} style={styles.bulletPoint}>
                    {item.startsWith("**") ? (
                      <>
                        •{" "}
                        <Text style={styles.highlight}>
                          {item.replace(/\*\*/g, "")}
                        </Text>
                      </>
                    ) : (
                      `• ${item}`
                    )}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ))}

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
    marginBottom: 30,
  },
  versionSection: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 30,
  },
  versionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e67e22",
    marginBottom: 5,
  },
  versionDate: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 15,
  },
  section: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#3498db",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: "#ffffff",
    lineHeight: 22,
    marginBottom: 8,
  },
  highlight: {
    color: "#3498db",
    fontWeight: "bold",
  },
  backButtonContainer: {
    marginTop: 20,
  },
  backButton: {
    width: 150,
    height: 50,
  },
});
