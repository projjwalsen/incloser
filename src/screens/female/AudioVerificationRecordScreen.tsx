import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useOnboardingStore } from "../../store/onboardingStore";
import GradientBackground from "../../components/GradientBackground";
import { Audio } from "expo-av";

type Nav = NativeStackNavigationProp<AuthStackParamList, "AudioVerificationRecord">;

// Verification scripts by language
const VERIFICATION_SCRIPTS: Record<string, string> = {
  bengali:
    "Nomaskar, Bondhutto khub e special hoi. Ami amar priyo son bondhuder sathe Friends app e porichoi korte esechi. Ami khub e utsuk",
  hindi:
    "Namaste, Dosti bahut khaas hoti hai. Main apne priye doston se milne Friends app par aayi hoon. Main bahut utsuk hoon",
  gujarati:
    "Namaste, Mitrata khas chhe. Hu mara priya mitro ne milva Friends app par aavi chhu. Hu bahut utsuk chhu",
  kannada:
    "Namaskara, Sneha vishēṣavāgide. Nanu nanna priya snēhitaranna Friends app nalli bēṭeyāḍalu bandidde. Nanu tumba utsukavāgi iddēne",
  tamil:
    "Vanakkam, Natpu romba vishesham. Naan en anbudana nanbarkalai Friends app-il santikka vanthullen. Naan romba aarvamaa irukken",
  malayalam:
    "Namaskaram, Snēhaṁ viśēṣamāṇ. Ñān ente iṣṭa snēhitarēyuṁ Friends app-il kaṇṭumuṭṭānāyi vannirikkunnu. Ñān valarey utsukanayi",
};

const MIN_RECORDING_DURATION_SEC = 2;

export default function AudioVerificationRecordScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { language, setAudioVerification } = useOnboardingStore();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const verificationScript =
    VERIFICATION_SCRIPTS[language || "bengali"] || VERIFICATION_SCRIPTS.bengali;

  // Request microphone permission on mount
  useEffect(() => {
    requestPermission();
    return () => {
      // Cleanup on unmount
      cleanupRecording();
    };
  }, []);

  const requestPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === "granted");
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Microphone access is required to record audio verification.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error requesting microphone permission:", error);
      setHasPermission(false);
    }
  };

  const cleanupRecording = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (recordingRef.current) {
      try {
        const status = await recordingRef.current.getStatusAsync();
        if (status.isRecording) {
          await recordingRef.current.stopAndUnloadAsync();
        }
      } catch (error) {
        console.error("Error cleaning up recording:", error);
      }
      recordingRef.current = null;
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      Alert.alert("Permission Denied", "Please grant microphone permission to record.");
      return;
    }

    try {
      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create new recording instance
      const recording = new Audio.Recording();
      
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      await recording.startAsync();
      
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      recordingStartTimeRef.current = Date.now();

      // Animate mic button
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
      }).start();

      // Start timer for duration display
      recordingTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);

    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording. Please try again.");
      cleanupRecording();
    }
  };

  const stopRecording = async () => {
    if (!isRecording || !recordingRef.current) return;

    try {
      setIsRecording(false);

      // Animate mic button back
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      // Clear timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      
      // Get recording status and URI
      const uri = recordingRef.current.getURI();
      const status = await recordingRef.current.getStatusAsync();
      
      recordingRef.current = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      if (!uri) {
        Alert.alert("Error", "Failed to save recording. Please try again.");
        return;
      }

      // Calculate duration in seconds
      const durationMillis = status.durationMillis || 0;
      const durationSec = Math.floor(durationMillis / 1000);

      // Check minimum duration
      if (durationSec < MIN_RECORDING_DURATION_SEC) {
        Alert.alert(
          "Recording Too Short",
          `Please record for at least ${MIN_RECORDING_DURATION_SEC} seconds.`,
          [{ text: "OK" }]
        );
        return;
      }

      // Store in zustand
      setAudioVerification({
        uri: uri,
        durationSec: durationSec,
      });

      // Navigate to submit screen
      navigation.navigate("AudioVerificationSubmit", {
        audioUri: uri,
        durationSec: durationSec,
      });

    } catch (error) {
      console.error("Failed to stop recording:", error);
      Alert.alert("Error", "Failed to stop recording. Please try again.");
      cleanupRecording();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (hasPermission === null) {
    return (
      <GradientBackground>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Requesting microphone permission...</Text>
        </View>
      </GradientBackground>
    );
  }

  if (hasPermission === false) {
    return (
      <GradientBackground>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Microphone permission denied</Text>
          <Pressable onPress={requestPermission} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Request Permission Again</Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View
        style={[
          styles.container,
          { paddingTop: Math.max(insets.top, 20) },
          { paddingBottom: Math.max(insets.bottom, 32) },
        ]}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Image
              source={require("../../../assets/images/back_icon.png")}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.subtitle}>Go for your</Text>
          <Text style={styles.title}>Audio Verification</Text>
          <View style={styles.infoRow}>
            <Image
              source={require("../../../assets/images/info_icon.png")}
              style={styles.infoIcon}
              resizeMode="contain"
            />
            <Text style={styles.infoText}>
              Record an audio of the lines below for verification.
            </Text>
          </View>
        </View>

        {/* Verification Script Card */}
        <View style={styles.scriptCard}>
          <Text style={styles.scriptText}>{verificationScript}</Text>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Recording Status */}
        {isRecording && (
          <View style={styles.recordingStatus}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              Recording... {formatDuration(recordingDuration)}
            </Text>
          </View>
        )}

        {/* Mic Button */}
        <View style={styles.micContainer}>
          <Pressable
            onPressIn={startRecording}
            onPressOut={stopRecording}
            disabled={!hasPermission}
            style={({ pressed }) => [
              styles.micButtonWrapper,
              pressed && styles.micButtonPressed,
            ]}
          >
            <Animated.View
              style={[
                styles.micButton,
                {
                  transform: [{ scale: scaleAnim }],
                },
                isRecording && styles.micButtonRecording,
              ]}
            >
              <Image
                source={require("../../../assets/images/mic_icon.png")}
                style={styles.micIcon}
                resizeMode="contain"
              />
            </Animated.View>
          </Pressable>
          <Text style={styles.micLabel}>
            {isRecording ? "Release to stop" : "Hold to talk"}
          </Text>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  errorText: {
    ...typography.body.large,
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.button.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    ...typography.button.medium,
    color: colors.text.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    width: 48,
    height: 48,
  },
  titleSection: {
    marginBottom: 32,
  },
  subtitle: {
    ...typography.body.medium,
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  title: {
    ...typography.display.small,
    fontSize: 28,
    color: colors.text.primary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  infoIcon: {
    width: 16,
    height: 16,
    marginTop: 2,
  },
  infoText: {
    ...typography.body.small,
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  scriptCard: {
    backgroundColor: colors.background.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scriptText: {
    ...typography.body.large,
    fontSize: 16,
    lineHeight: 24,
    color: "#3B82F6",
    textAlign: "center",
  },
  spacer: {
    flex: 1,
  },
  recordingStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },
  recordingText: {
    ...typography.body.medium,
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: "600",
  },
  micContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  micButtonWrapper: {
    marginBottom: 16,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  micButtonRecording: {
    backgroundColor: "#FFF5F9",
    shadowColor: colors.button.primary,
    shadowOpacity: 0.3,
  },
  micButtonPressed: {
    opacity: 0.9,
  },
  micIcon: {
    width: 32,
    height: 32,
    tintColor: colors.button.primary,
  },
  micLabel: {
    ...typography.body.medium,
    fontSize: 16,
    color: colors.text.secondary,
  },
});
