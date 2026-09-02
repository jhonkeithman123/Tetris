import authService, { formatAuthError } from "@/app/services/authService";
import { auth } from "@/app/services/firebaseConfig";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  NativeModules,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const googleClientId =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_CLIENT_ID ||
  "";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (displayName: string) => void;
}

type AuthMode = "signin" | "signup" | "forgot";

export default function AuthModal({
  visible,
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (mode === "forgot") {
      setLoading(true);
      try {
        await authService.sendPasswordReset(email);
        setInfoMessage("Password reset email sent! Check your inbox.");
      } catch (err: any) {
        setErrorMessage(formatAuthError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        if (!displayName.trim()) {
          setErrorMessage("Please enter a player name.");
          setLoading(false);
          return;
        }
        const user = await authService.signUpWithEmail(
          email,
          password,
          displayName,
        );
        onSuccess(user.displayName || displayName || "Player");
        handleClose();
      } else {
        const user = await authService.signInWithEmail(email, password);
        onSuccess(user.displayName || user.email?.split("@")[0] || "Player");
        handleClose();
      }
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    if (!googleClientId) {
      setErrorMessage(
        "Google Sign-In: Web Client ID not configured yet in .env (EXPO_PUBLIC_GOOGLE_CLIENT_ID).",
      );
      return;
    }

    // Check if the native Google Sign-In module is registered in the running binary
    const hasNativeGoogleModule =
      NativeModules?.RNGoogleSignin ||
      (global as any)?.__turboModuleProxy?.("RNGoogleSignin");

    if (!hasNativeGoogleModule) {
      setErrorMessage(
        "Native Google Sign-In module is not yet compiled into this APK build.\n\nRun 'bun run android' in your terminal to build it into your device.\n\nIn the meantime, you can sign in or register instantly using Email and Password!",
      );
      return;
    }

    setLoading(true);
    try {
      const {
        GoogleSignin,
        statusCodes,
      } = require("@react-native-google-signin/google-signin");

      GoogleSignin.configure({
        webClientId: googleClientId || undefined,
        offlineAccess: true,
      });

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const response = await GoogleSignin.signIn();
      const idToken =
        (response as any)?.data?.idToken || (response as any)?.idToken;

      if (!idToken) {
        throw new Error("Could not retrieve ID token from Google Sign-In.");
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const userCred = await signInWithCredential(auth, credential);
      onSuccess(
        userCred.user.displayName ||
          userCred.user.email?.split("@")[0] ||
          "Player",
      );
      handleClose();
    } catch (err: any) {
      let statusCodes: any;
      try {
        statusCodes =
          require("@react-native-google-signin/google-signin").statusCodes;
      } catch (e) {}

      if (statusCodes && err.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled
      } else if (statusCodes && err.code === statusCodes.IN_PROGRESS) {
        // Already in progress
      } else if (
        statusCodes &&
        err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
      ) {
        setErrorMessage("Google Play Services is not available or outdated.");
      } else {
        setErrorMessage(
          err?.message ||
            "Google sign-in error. You can also sign in instantly using Email and Password.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === "signin"
                ? "PLAYER SIGN IN"
                : mode === "signup"
                  ? "CREATE ACCOUNT"
                  : "RESET PASSWORD"}
            </Text>
            <Text style={styles.subtitle}>
              {mode === "signin"
                ? "Sign in to compete on the global leaderboard"
                : mode === "signup"
                  ? "Join the Tetris arcade global rankings"
                  : "Enter your email to receive a recovery link"}
            </Text>
          </View>

          {/* Mode Switch Tabs */}
          {mode !== "forgot" && (
            <View style={styles.tabBar}>
              <Pressable
                style={[styles.tab, mode === "signin" && styles.activeTab]}
                onPress={() => {
                  setMode("signin");
                  setErrorMessage(null);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    mode === "signin" && styles.activeTabText,
                  ]}
                >
                  SIGN IN
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, mode === "signup" && styles.activeTab]}
                onPress={() => {
                  setMode("signup");
                  setErrorMessage(null);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    mode === "signup" && styles.activeTabText,
                  ]}
                >
                  REGISTER
                </Text>
              </Pressable>
            </View>
          )}

          {/* Messages */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}
          {infoMessage && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{infoMessage}</Text>
            </View>
          )}

          {/* Form Fields */}
          <ScrollView
            style={styles.formContainer}
            keyboardShouldPersistTaps="handled"
          >
            {mode === "signup" && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PLAYER NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. BlockMaster99"
                  placeholderTextColor="#666"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  maxLength={20}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="player@example.com"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {mode !== "forgot" && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            )}

            {mode === "signin" && (
              <Pressable
                style={styles.forgotButton}
                onPress={() => {
                  setMode("forgot");
                  setErrorMessage(null);
                }}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
            )}

            {mode === "forgot" && (
              <Pressable
                style={styles.forgotButton}
                onPress={() => {
                  setMode("signin");
                  setErrorMessage(null);
                }}
              >
                <Text style={styles.forgotText}>Back to Sign In</Text>
              </Pressable>
            )}

            {/* Primary Action Button */}
            <Pressable
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {mode === "signin"
                    ? "SIGN IN"
                    : mode === "signup"
                      ? "CREATE ACCOUNT"
                      : "SEND RESET LINK"}
                </Text>
              )}
            </Pressable>

            {/* Google Sign In Divider & Button */}
            {mode !== "forgot" && (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  style={styles.googleButton}
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                >
                  <Image
                    source={require("@/assets/images/google.png")}
                    style={styles.googleIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                </Pressable>
              </>
            )}

            {/* Guest mode / Play offline */}
            <Pressable
              style={styles.guestButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.guestButtonText}>
                Play as Guest (Offline Scores Only)
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#12121e",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#3498db",
    width: "100%",
    maxWidth: 400,
    maxHeight: "90%",
    padding: 24,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3498db",
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#8e9aaf",
    textAlign: "center",
    lineHeight: 16,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#0d0d17",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#20203a",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "#3498db",
  },
  tabText: {
    color: "#7f8c8d",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  activeTabText: {
    color: "#ffffff",
  },
  errorBox: {
    backgroundColor: "rgba(231, 76, 60, 0.2)",
    borderWidth: 1,
    borderColor: "#e74c3c",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 12,
    textAlign: "center",
  },
  infoBox: {
    backgroundColor: "rgba(46, 204, 113, 0.2)",
    borderWidth: 1,
    borderColor: "#2ecc71",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: {
    color: "#2ecc71",
    fontSize: 12,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: "#8e9aaf",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#2c3e50",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 14,
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 16,
  },
  forgotText: {
    color: "#3498db",
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: "#3498db",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#2c3e50",
  },
  dividerText: {
    color: "#6c7a89",
    paddingHorizontal: 12,
    fontSize: 11,
    fontWeight: "bold",
  },
  googleButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    color: "#1a1a2e",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  guestButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  guestButtonText: {
    color: "#7f8c8d",
    fontSize: 12,
    textDecorationLine: "underline",
  },
});
