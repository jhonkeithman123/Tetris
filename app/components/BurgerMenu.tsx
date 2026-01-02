import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const BurgerMenu = ({
  onExit,
  onHelp,
  onAccount,
}: {
  onExit: () => void;
  onHelp: () => void;
  onAccount: () => void;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const slideAnim = useRef(new Animated.Value(-250)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -250,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }).start();
  }, [isOpen]);

  return (
    <>
      {/* Burger Button */}
      <Pressable style={styles.burgerButton} onPress={() => setIsOpen(!isOpen)}>
        <View style={styles.burgerLine} />
        <View style={styles.burgerLine} />
        <View style={styles.burgerLine} />
      </Pressable>

      {/* Overlay */}
      {isOpen && (
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)} />
      )}

      {/* Side Menu */}
      <Animated.View
        style={[styles.sideMenu, { transform: [{ translateX: slideAnim }] }]}
      >
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Menu</Text>
          <Pressable onPress={() => setIsOpen(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.menuItem}
          onPress={() => {
            setIsOpen(false);
            onAccount();
          }}
        >
          <Text style={styles.menuItemText}>👤 Account</Text>
        </Pressable>

        <Pressable
          style={styles.menuItem}
          onPress={() => {
            setIsOpen(false);
            onHelp();
          }}
        >
          <Text style={styles.menuItemText}>❓ Help</Text>
        </Pressable>

        <View style={styles.menuDivider} />

        <Pressable
          style={[styles.menuItem, styles.exitItem]}
          onPress={() => {
            setIsOpen(false);
            onExit();
          }}
        >
          <Text style={[styles.menuItemText, styles.exitText]}>🚪 Exit</Text>
        </Pressable>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  burgerButton: {
    position: "absolute",
    top: 40,
    left: 20,
    width: 40,
    height: 40,
    justifyContent: "space-around",
    zIndex: 1000,
    padding: 8,
  },
  burgerLine: {
    width: "100%",
    height: 3,
    backgroundColor: "#ffffff",
    borderRadius: 2,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
  },
  sideMenu: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 250,
    height: "100%",
    backgroundColor: "#1a1a2e",
    zIndex: 1001,
    paddingTop: 50,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#3498db",
  },
  menuTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3498db",
  },
  closeButton: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  menuItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2c2c4e",
  },
  menuItemText: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "500",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#3498db",
    marginVertical: 10,
  },
  exitItem: {
    backgroundColor: "#e74c3c",
  },
  exitText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});

export default BurgerMenu;
