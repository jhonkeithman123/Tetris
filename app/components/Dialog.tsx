import React from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface DialogBoxProps {
  visible: boolean;
  title?: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "confirm" | "alert";
}

export default function DialogBox({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "Cancel",
  type = "alert",
}: DialogBoxProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel || onConfirm}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {title && <Text style={styles.title}>{title}</Text>}
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            {type === "confirm" && onCancel && (
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </Pressable>
            )}

            {onConfirm && (
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.confirmButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={onConfirm}
              >
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    backgroundColor: "#1a1a2e",
    borderRadius: 15,
    padding: 20,
    width: width * 0.8,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    textShadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: "#3498db",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3498db",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#3498db",
  },
  cancelButton: {
    backgroundColor: "#e01e1eff",
  },
  buttonPressed: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
