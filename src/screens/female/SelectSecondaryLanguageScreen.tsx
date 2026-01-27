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
import { useOnboardingStore, type Language } from "../../store/onboardingStore";
import GradientBackground from "../../components/GradientBackground";
import { LANGUAGES, type LanguageOption } from "../../constants/languages";

type Nav = NativeStackNavigationProp<AuthStackParamList, "SelectSecondaryLanguage">;

export default function SelectSecondaryLanguageScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { secondaryLanguages, toggleSecondaryLanguage } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleLanguage = (langId: string) => {
    toggleSecondaryLanguage(langId as Exclude<Language, null>);
  };

  const handleSaveAndContinue = async () => {
    if (secondaryLanguages.length === 0) return;

    setIsLoading(true);
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    navigation.navigate("AudioVerificationRecord");
    setIsLoading(false);
  };

  const isButtonEnabled = secondaryLanguages.length > 0 && !isLoading;

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
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.subtitle}>Select your</Text>
            <Text style={styles.title}>Secondary Language</Text>
            <View style={styles.infoRow}>
              <Image
                source={require("../../../assets/images/info_icon.png")}
                style={styles.infoIcon}
                resizeMode="contain"
              />
              <Text style={styles.infoText}>Any other language to speak</Text>
            </View>
          </View>

          {/* Language Grid */}
          <View style={styles.gridContainer}>
            {LANGUAGES.map((lang) => (
              <MultiSelectLanguageCard
                key={lang.id}
                language={lang}
                selected={secondaryLanguages.includes(lang.id as Exclude<Language, null>)}
                onToggle={() => handleToggleLanguage(lang.id)}
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

// Reusable Multi-Select Language Card Component
interface MultiSelectLanguageCardProps {
  language: LanguageOption;
  selected: boolean;
  onToggle: () => void;
}

function MultiSelectLanguageCard({
  language,
  selected,
  onToggle,
}: MultiSelectLanguageCardProps) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.languageCard,
        selected && styles.languageCardSelected,
        pressed && styles.languageCardPressed,
      ]}
    >
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <View style={styles.checkboxInner} />}
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
    marginBottom: 24,
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
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoIcon: {
    width: 16,
    height: 16,
  },
  infoText: {
    ...typography.body.small,
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
  checkbox: {
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
  checkboxSelected: {
    borderColor: colors.button.primary,
  },
  checkboxInner: {
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
