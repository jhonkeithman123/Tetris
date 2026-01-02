import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface HelpProps {
  onBack: () => void;
}

export default function Help({ onBack }: HelpProps) {
  const [backPressed, setBackPressed] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>HOW TO PLAY</Text>

        {/* Controls Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Controls</Text>
          <View style={styles.controlRow}>
            <Text style={styles.controlIcon}>⬅️ ➡️</Text>
            <Text style={styles.controlText}>Move piece left/right</Text>
          </View>
          <View style={styles.controlRow}>
            <Text style={styles.controlIcon}>⬇️</Text>
            <Text style={styles.controlText}>Move piece down faster</Text>
          </View>
          <View style={styles.controlRow}>
            <Text style={styles.controlIcon}>🔄</Text>
            <Text style={styles.controlText}>Rotate piece</Text>
          </View>
          <View style={styles.controlRow}>
            <Text style={styles.controlIcon}>⏬</Text>
            <Text style={styles.controlText}>Hard drop (instant drop)</Text>
          </View>
          <View style={styles.controlRow}>
            <Text style={styles.controlIcon}>📦</Text>
            <Text style={styles.controlText}>Hold/swap current piece</Text>
          </View>
        </View>

        {/* Gameplay Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gameplay</Text>
          <Text style={styles.bodyText}>
            • Stack falling blocks to create complete horizontal lines{"\n"}•
            Complete lines will disappear and award points{"\n"}• Clear multiple
            lines at once for combo bonuses{"\n"}• Use the HOLD feature to save
            a piece for later{"\n"}• Game ends when blocks reach the top
          </Text>
        </View>

        {/* Scoring Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scoring</Text>
          <Text style={styles.bodyText}>
            • 1 line: 100 points × level{"\n"}• 2 lines: 200 points × level
            {"\n"}• 3 lines: 300 points × level{"\n"}• 4 lines: 400 points ×
            level{"\n"}• Level increases with lines cleared
          </Text>
        </View>

        {/* Special Pieces */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Pieces</Text>
          <Text style={styles.bodyText}>
            • <Text style={styles.highlight}>Cross Block (+)</Text>: Rare piece
            that appears less frequently{"\n"}• All other standard Tetris pieces
            appear equally{"\n"}• Each piece comes in random colors
          </Text>
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips</Text>
          <Text style={styles.bodyText}>
            • Plan ahead using the NEXT piece preview{"\n"}• Save difficult
            pieces with HOLD for better opportunities{"\n"}• Keep the stack as
            low as possible{"\n"}• Try to leave room for the I-piece (straight
            block){"\n"}• Clear lines quickly to prevent stacking too high
          </Text>
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
    marginBottom: 30,
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
    marginBottom: 15,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  controlIcon: {
    fontSize: 24,
    width: 50,
  },
  controlText: {
    fontSize: 14,
    color: "#ffffff",
    flex: 1,
  },
  bodyText: {
    fontSize: 14,
    color: "#ffffff",
    lineHeight: 22,
  },
  highlight: {
    color: "#e67e22",
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
