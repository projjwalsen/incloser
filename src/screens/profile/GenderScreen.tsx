import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useOnboardingStore, type Gender } from "../../store/onboardingStore";
import GradientBackground from "../../components/GradientBackground";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Gender">;

export default function GenderScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { gender, setGender } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGenderSelect = (selectedGender: Gender) => {
    setGender(selectedGender);
  };

  const handleProceed = async () => {
    if (!gender) return;

    setIsLoading(true);
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Navigate based on gender
    if (gender === "male") {
      navigation.navigate("CreateProfile");
    } else if (gender === "female") {
      navigation.navigate("FemaleCreateProfile");
    }
    setIsLoading(false);
  };

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 20) },
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

        {/* Main Content */}
        <View style={styles.content}>
          {/* Heading Text */}
          <View style={styles.headingContainer}>
            <Text style={styles.headingLine1}>Select Your</Text>
            <Text style={styles.headingLine2}>Gender</Text>
          </View>

          {/* Gender Cards */}
          <View style={styles.cardsContainer}>
            {/* Male Card */}
            <Pressable
              onPress={() => handleGenderSelect("male")}
              style={({ pressed }) => [
                styles.card,
                gender === "male" && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.avatarContainer}>
                <Image
                  source={require("../../../assets/images/male_profile.png")}
                  style={styles.avatarImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.cardLabel}>Male</Text>
            </Pressable>

            {/* Female Card */}
            <Pressable
              onPress={() => handleGenderSelect("female")}
              style={({ pressed }) => [
                styles.card,
                gender === "female" && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.avatarContainer}>
                <Image
                  source={require("../../../assets/images/female_profile.png")}
                  style={styles.avatarImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.cardLabel}>Female</Text>
              <View style={styles.audioVerificationContainer}>
                <Image
                  source={require("../../../assets/images/mic_icon.png")}
                  style={styles.micIcon}
                  resizeMode="contain"
                />
                <Text style={styles.audioVerificationText}>
                  Audio verification needed
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Info Text - Above Button */}
        <View style={styles.infoTextContainer}>
          <Image
            source={require("../../../assets/images/info_icon.png")}
            style={styles.infoIcon}
            resizeMode="contain"
          />
          <Text style={styles.infoText}>
            Gender can't be changed later
          </Text>
        </View>

        {/* Bottom CTA Button */}
        <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 32) }]}>
          <Pressable
            onPress={handleProceed}
            disabled={!gender || isLoading}
            style={({ pressed }) => [
              styles.button,
              (!gender || isLoading) && styles.buttonDisabled,
              pressed && gender && !isLoading && styles.buttonPressed,
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                (!gender || isLoading) && styles.buttonTextDisabled,
              ]}
            >
              Proceed
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    width: 48,
    height: 48,
  },
  content: {
    flex: 1,
    alignItems: "center",
  },
  headingContainer: {
    alignItems: "flex-start",
    width: "100%",
    marginBottom: 24,
  },
  headingLine1: {
    ...typography.body.small,
    fontSize: 12,
    color: colors.text.primary,
    textAlign: "left",
    marginBottom: 4,
  },
  headingLine2: {
    ...typography.display.small,
    fontSize: 28,
    color: colors.text.primary,
    textAlign: "left",
  },
  cardsContainer: {
    flexDirection: "column",
    gap: 12,
    width: "100%",
    marginBottom: 16,
  },
  card: {
    width: "100%",
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.input.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    borderColor: colors.button.primary,
    backgroundColor: "#FFF5F9",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.8,
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatarImage: {
    width: 140,
    height: 160,
  },
  cardLabel: {
    ...typography.body.large,
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: "500",
    marginBottom: 8,
  },
  audioVerificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  micIcon: {
    width: 14,
    height: 14,
  },
  audioVerificationText: {
    ...typography.body.small,
    fontSize: 12,
    color: colors.text.secondary,
  },
  infoTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  infoIcon: {
    width: 16,
    height: 16,
  },
  infoText: {
    ...typography.body.small,
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: "center",
  },
  buttonContainer: {
    paddingHorizontal: 0,
    marginTop: 12,
  },
  button: {
    backgroundColor: colors.button.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  buttonDisabled: {
    backgroundColor: colors.input.border,
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    ...typography.button.large,
    color: colors.text.white,
  },
  buttonTextDisabled: {
    color: colors.text.tertiary,
  },
});
