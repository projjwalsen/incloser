import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Welcome">;

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.gradient.welcome.start, colors.gradient.welcome.end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Top Branding - Logo */}
      <View style={[styles.topSection, { paddingTop: Math.max(insets.top, 40) }]}>
        <Image
          source={require("../../../assets/images/Logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {/* Centered Illustration */}
        <View style={styles.illustrationContainer}>
          <Image
            source={require("../../../assets/images/welcome-illustration.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Tagline Text */}
        <View style={styles.taglineContainer}>
          <Text style={styles.tagline}>Connect. Build friendships.</Text>
          <Text style={styles.description}>
            Connect with real people via voice and video calls. Build genuine friendships anytime, anywhere.
          </Text>
        </View>
      </View>

      {/* Bottom CTA Button */}
      <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 32) }]}>
        <Pressable
          onPress={() => navigation.navigate("Phone")}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Image
            source={require("../../../assets/images/welcome_bt.png")}
            style={styles.buttonImage}
            resizeMode="contain"
          />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  logo: {
    width: 210,
    height: 82,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  illustrationContainer: {
    width: "100%",
    maxWidth: 320,
    aspectRatio: 1,
    marginBottom: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  illustration: {
    width: "100%",
    height: "100%",
  },
  taglineContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  tagline: {
    ...typography.tagline,
    color: colors.text.secondary,
    textAlign: "center",
  },
  description: {
    ...typography.description,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 12,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: "center",
  },
  button: {
    width: "100%",
    maxWidth: 320,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonImage: {
    width: "100%",
    height: 56,
  },
});
