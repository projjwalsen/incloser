import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import GradientBackground from "../../components/GradientBackground";
import { Audio } from "expo-av";

type AudioVerificationSubmitRouteProp = RouteProp<
  AuthStackParamList,
  "AudioVerificationSubmit"
>;
type Nav = NativeStackNavigationProp<AuthStackParamList, "AudioVerificationSubmit">;

export default function AudioVerificationSubmitScreen() {
  const route = useRoute<AudioVerificationSubmitRouteProp>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const { audioUri, durationSec } = route.params;

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const playbackUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load sound on mount
  useEffect(() => {
    loadSound();
    return () => {
      // Cleanup on unmount
      unloadSound();
    };
  }, []);

  const loadSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading sound:", error);
      Alert.alert("Error", "Failed to load audio. Please try re-recording.");
      setIsLoading(false);
    }
  };

  const unloadSound = async () => {
    if (playbackUpdateIntervalRef.current) {
      clearInterval(playbackUpdateIntervalRef.current);
      playbackUpdateIntervalRef.current = null;
    }

    if (sound) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error("Error unloading sound:", error);
      }
      setSound(null);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.isPlaying) {
        const currentPositionSec = Math.floor(status.positionMillis / 1000);
        setCurrentTime(currentPositionSec);
      }

      // Check if playback finished
      if (status.didJustFinish) {
        setIsPlaying(false);
        setCurrentTime(durationSec);
      }
    }
  };

  const togglePlayback = async () => {
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();

      if (!status.isLoaded) {
        return;
      }

      if (isPlaying) {
        // Pause
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        // Play (reset to start if at end)
        if (currentTime >= durationSec) {
          await sound.setPositionAsync(0);
          setCurrentTime(0);
        }
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error toggling playback:", error);
      Alert.alert("Error", "Failed to play audio.");
    }
  };

  const handleReRecord = async () => {
    await unloadSound();
    navigation.goBack();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Stop playback if playing
    if (sound && isPlaying) {
      try {
        await sound.pauseAsync();
        setIsPlaying(false);
      } catch (error) {
        console.error("Error pausing sound:", error);
      }
    }

    // Simulate API submission delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    Alert.alert(
      "Success!",
      "Your audio verification has been submitted successfully.",
      [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("NextStepPlaceholder");
          },
        },
      ]
    );

    setIsSubmitting(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = durationSec > 0 ? currentTime / durationSec : 0;

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
          <Text style={styles.subtitle}>Submit</Text>
          <Text style={styles.title}>Audio Verification</Text>
          <View style={styles.infoRow}>
            <Image
              source={require("../../../assets/images/info_icon.png")}
              style={styles.infoIcon}
              resizeMode="contain"
            />
            <Text style={styles.infoText}>
              Here is your recorded audio. You can re-record until satisfied.
            </Text>
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Audio Player */}
        {isLoading ? (
          <View style={styles.playerCard}>
            <Text style={styles.loadingText}>Loading audio...</Text>
          </View>
        ) : (
          <View style={styles.playerCard}>
            <Pressable
              onPress={togglePlayback}
              disabled={!sound}
              style={({ pressed }) => [
                styles.playButton,
                pressed && styles.playButtonPressed,
              ]}
            >
              <View style={styles.playIconWrapper}>
                {isPlaying ? (
                  // Pause icon (two vertical bars)
                  <View style={styles.pauseIcon}>
                    <View style={styles.pauseBar} />
                    <View style={styles.pauseBar} />
                  </View>
                ) : (
                  // Play icon (triangle)
                  <View style={styles.playTriangle} />
                )}
              </View>
            </Pressable>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                <View
                  style={[
                    styles.progressThumb,
                    { left: `${Math.max(0, Math.min(100, progress * 100))}%` },
                  ]}
                />
              </View>

              {/* Time Display */}
              <Text style={styles.timeText}>
                {formatTime(currentTime)} / {formatTime(durationSec)}
              </Text>
            </View>
          </View>
        )}

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Bottom Buttons */}
        <View style={styles.buttonRow}>
          <Pressable
            onPress={handleReRecord}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.outlineButton,
              pressed && styles.outlineButtonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.outlineButtonText}>Re-record</Text>
          </Pressable>

          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting || isLoading}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && !isSubmitting && styles.submitButtonPressed,
              (isSubmitting || isLoading) && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Text>
          </Pressable>
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
  spacer: {
    flex: 1,
  },
  playerCard: {
    backgroundColor: colors.background.white,
    borderRadius: 40,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    ...typography.body.medium,
    color: colors.text.secondary,
    flex: 1,
    textAlign: "center",
  },
  playButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonPressed: {
    opacity: 0.7,
  },
  playIconWrapper: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  playTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 16,
    borderRightWidth: 0,
    borderBottomWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: colors.button.primary,
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderTopColor: "transparent",
    marginLeft: 4,
  },
  pauseIcon: {
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  pauseBar: {
    width: 6,
    height: 20,
    backgroundColor: colors.button.primary,
    borderRadius: 2,
  },
  progressContainer: {
    flex: 1,
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    position: "relative",
    overflow: "visible",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.button.primary,
    borderRadius: 3,
  },
  progressThumb: {
    position: "absolute",
    top: -3,
    width: 12,
    height: 12,
    backgroundColor: colors.button.primary,
    borderRadius: 6,
    marginLeft: -6,
  },
  timeText: {
    ...typography.body.small,
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: "right",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  outlineButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.button.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  outlineButtonPressed: {
    opacity: 0.7,
    backgroundColor: "#FFF5F9",
  },
  outlineButtonText: {
    ...typography.button.large,
    color: colors.button.primary,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.button.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  submitButtonText: {
    ...typography.button.large,
    color: colors.text.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
