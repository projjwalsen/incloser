import React, { useState } from "react";
import {
  Alert,
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
import { useOnboardingStore, type Language } from "../../store/onboardingStore";
import GradientBackground from "../../components/GradientBackground";
import { LANGUAGES, type LanguageOption } from "../../constants/languages";
import { completeMaleRegistration } from "../../services/registration/completeMaleRegistration";

type Nav = NativeStackNavigationProp<AuthStackParamList, "SelectLanguage">;

export default function SelectLanguageScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const {
    language,
    gender,
    phone,
    countryCode,
    nickname,
    avatarId,
    isAdultConfirmed,
    setLanguage,
    setMaleOnboardingCompleted,
  } = useOnboardingStore();

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectLanguage = (lang: Language) => {
    setSelectedLanguage(lang);
  };

  const handleSaveAndContinue = async () => {
    if (!selectedLanguage || isLoading) return;

    setIsLoading(true);
    setLanguage(selectedLanguage);

    if (gender === "female") {
      await new Promise((resolve) => setTimeout(resolve, 300));
      navigation.navigate("SelectSecondaryLanguage");
      setIsLoading(false);
      return;
    }

    try {
      await completeMaleRegistration({
        phone,
        countryCode,
        gender,
        nickname,
        avatarId,
        isAdultConfirmed,
        language: selectedLanguage,
      });
      setMaleOnboardingCompleted(true);

      navigation.reset({
        index: 0,
        routes: [{ name: "MaleHome" }],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed.";
      Alert.alert("Registration failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonEnabled = selectedLanguage !== null && !isLoading;

  return (
    <GradientBackground>
      <View style={styles.container}>
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
            <Text style={styles.headerTitle}>Select language</Text>
            <View style={styles.backButton} />
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.subtitle}>Select your Call</Text>
            <Text style={styles.title}>Language</Text>
          </View>

          {/* Language Grid */}
          <View style={styles.gridContainer}>
            {LANGUAGES.map((lang) => (
              <LanguageOptionCard
                key={lang.id}
                language={lang}
                selected={selectedLanguage === lang.id}
                onSelect={() => handleSelectLanguage(lang.id as Language)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Bottom CTA Button - Fixed at bottom */}
        <View
          style={[
            styles.buttonContainer,
            { paddingBottom: Math.max(insets.bottom, 32) },
          ]}
        >
          <Pressable
            onPress={handleSaveAndContinue}
            disabled={!isButtonEnabled}
            style={({ pressed }) => [
              styles.button,
              !isButtonEnabled && styles.buttonDisabled,
              pressed && isButtonEnabled && styles.buttonPressed,
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                !isButtonEnabled && styles.buttonTextDisabled,
              ]}
            >
              Save and Continue
            </Text>
          </Pressable>
        </View>
      </View>
    </GradientBackground>
  );
}

// Reusable Language Option Card Component
interface LanguageOptionCardProps {
  language: LanguageOption;
  selected: boolean;
  onSelect: () => void;
}

function LanguageOptionCard({
  language,
  selected,
  onSelect,
}: LanguageOptionCardProps) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.languageCard,
        selected && styles.languageCardSelected,
        pressed && styles.languageCardPressed,
      ]}
    >
      <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <View style={styles.languageTextContainer}>
        <Text style={styles.languageEnglish}>{language.nameEnglish}</Text>
        <Text style={styles.languageNative}>{language.nameNative}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  headerTitle: {
    ...typography.body.medium,
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: "500",
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    ...typography.display.small,
    fontSize: 28,
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body.medium,
    fontSize: 14,
    color: colors.text.secondary,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  languageCard: {
    width: "48%",
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.input.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  languageCardSelected: {
    borderColor: colors.button.primary,
    backgroundColor: "#FFF5F9",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  languageCardPressed: {
    opacity: 0.8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.input.border,
    backgroundColor: colors.background.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: colors.button.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.button.primary,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageEnglish: {
    ...typography.body.medium,
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: "500",
    marginBottom: 2,
  },
  languageNative: {
    ...typography.body.small,
    fontSize: 12,
    color: colors.text.secondary,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: "transparent",
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
