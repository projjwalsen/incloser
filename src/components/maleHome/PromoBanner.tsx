import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

interface PromoBannerProps {
  onPressRandom: () => void;
}

export default function PromoBanner({ onPressRandom }: PromoBannerProps) {
  return (
    <View style={styles.container}>
      {/* Left: Random illustration */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require("../../../assets/images/randomSection_img.png")}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* Center: Text */}
      <View style={styles.textContainer}>
        <Text style={styles.titleLine1}>Stay Connected &</Text>
        <Text style={styles.titleLine2}>Make friends</Text>
        <Text style={styles.subtitle}>@ ₹2 / Min Only!</Text>
      </View>

      {/* Right: Random Call Button with Gradient */}
      <Pressable
        onPress={onPressRandom}
        style={({ pressed }) => [
          pressed && styles.buttonPressed,
        ]}
      >
        <LinearGradient
          colors={["#FF1493", "#FF69B4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Random Call</Text>
          <Image
            source={require("../../../assets/images/random_icon.png")}
            style={styles.buttonIcon}
            resizeMode="contain"
          />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    // Removed shadow properties to allow transparency to work properly
    // Shadow can interfere with transparent backgrounds
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  illustrationContainer: {
    width: 60,
    height: 60,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  illustration: {
    width: 60,
    height: 60,
  },
  textContainer: {
    flex: 1,
  },
  titleLine1: {
    ...typography.body.medium,
    fontSize: 12,
    lineHeight: 16,
    color: "#3B82F6",
  },
  titleLine2: {
    ...typography.body.medium,
    fontSize: 20,
    lineHeight: 15,
    color: "#3B82F6",
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    ...typography.body.small,
    fontSize: 11,
    color: colors.text.secondary,
  },
  button: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    ...typography.button.small,
    color: colors.text.white,
    fontSize: 12,
  },
  buttonIcon: {
    width: 14,
    height: 14,
    tintColor: colors.text.white,
  },
});
