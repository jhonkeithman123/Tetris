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
            <Text style={styles.controlText}>
              Hard drop (instant drop with motion blur effect)
            </Text>
          </View>
          <View style={styles.controlRow}>
            <Text style={styles.controlIcon}>H</Text>
            <Text style={styles.controlText}>
              Hold/swap current piece (once per piece)
            </Text>
          </View>
        </View>

        {/* Gameplay Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gameplay</Text>
          <Text style={styles.bodyText}>
            • Stack falling blocks to create complete horizontal lines{"\n"}•
            Complete lines will disappear and award points{"\n"}• Clear multiple
            lines at once for combo bonuses{"\n"}• Use the HOLD feature to save
            a piece for later{"\n"}•{" "}
            <Text style={styles.highlight}>Ghost piece</Text> shows where your
            block will land{"\n"}• Preview the next 2 pieces in the right panel
            {"\n"}• Game ends when blocks reach the top
          </Text>
        </View>

        {/* Visual Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visual Features</Text>
          <Text style={styles.bodyText}>
            • <Text style={styles.highlight}>Ghost Piece</Text>: A colored
            outline showing exactly where your piece will land{"\n"}•{" "}
            <Text style={styles.highlight}>Hard Drop Animation</Text>: Stunning
            motion blur trail effect when using hard drop{"\n"}•{" "}
            <Text style={styles.highlight}>Next Piece Preview</Text>: See the
            next 2 upcoming pieces{"\n"}• Each piece type has unique colored
            ghost outlines for easy identification
          </Text>
        </View>

        {/* Scoring Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scoring</Text>
          <Text style={styles.bodyText}>
            • 1 line: 100 points × level{"\n"}• 2 lines: 200 points × level
            {"\n"}• 3 lines: 300 points × level{"\n"}• 4 lines: 400 points ×
            level{"\n"}• Level increases every 10 lines cleared
          </Text>
        </View>

        {/* Combo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Combo System</Text>
          <Text style={styles.bodyText}>
            • Clear lines consecutively to build a{" "}
            <Text style={styles.highlight}>COMBO</Text>
            {"\n"}• Each line clear in succession increases your multiplier
            {"\n"}• Combo bonuses:{" "}
            <Text style={styles.highlight}>+10 × combo count</Text>
            {"\n"}• Maximum combo: <Text style={styles.highlight}>7x</Text>
            {"\n"}• Combo resets if you don't clear lines within 6 seconds
            {"\n"}• {"\n"}
            <Text style={styles.comboExample}>Combo Examples:</Text>
            {"\n"}• x1 Combo: +10 bonus points{"\n"}• x2 Combo: +20 bonus points
            {"\n"}• x3 Combo: +30 bonus points{"\n"}• x7 Combo: +70 bonus points
          </Text>
        </View>

        {/* Special Pieces */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Block Types</Text>
          <Text style={styles.bodyText}>
            <Text style={styles.highlight}>Classic Pieces (Common):</Text>
            {"\n"}• Straight Block (I){"\n"}• Square Block (O){"\n"}• T-Block
            {"\n"}• Z-Block & Reverse Z-Block{"\n"}• L-Block & Reverse L-Block
            {"\n"}• Short L-Block & Reverse Short L-Block{"\n"}
            {"\n"}
            <Text style={styles.highlight}>Special Pieces (Rare):</Text>
            {"\n"}• <Text style={styles.special}>Diagonal Block</Text>: 3x3
            diagonal pattern{"\n"}•{" "}
            <Text style={styles.special}>Straight Z Block</Text>: Extended
            Z-shape (4 cells wide){"\n"}•{" "}
            <Text style={styles.special}>Long L Block</Text>: 5-cell L-shape
            {"\n"}• <Text style={styles.special}>Cross Block (+)</Text>: Super
            rare centerpiece{"\n"}
            {"\n"}• All pieces come in random vibrant colors
          </Text>
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pro Tips</Text>
          <Text style={styles.bodyText}>
            • Use the <Text style={styles.highlight}>ghost piece outline</Text>{" "}
            to position blocks accurately{"\n"}• Plan ahead using the NEXT 2
            piece previews{"\n"}• Save difficult pieces with HOLD for better
            opportunities{"\n"}• Watch the{" "}
            <Text style={styles.highlight}>motion blur trail</Text> during hard
            drop for satisfying feedback{"\n"}• Keep the stack as low as
            possible{"\n"}• Try to leave room for the I-piece (straight block)
            {"\n"}• Clear lines quickly to maintain combo streak{"\n"}• Special
            pieces are rare but can create unique clearing opportunities
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
  special: {
    color: "#9b59b6",
    fontWeight: "bold",
  },
  comboExample: {
    color: "#f39c12",
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
