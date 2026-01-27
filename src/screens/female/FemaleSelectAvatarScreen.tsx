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
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useOnboardingStore } from "../../store/onboardingStore";
import GradientBackground from "../../components/GradientBackground";
import { FEMALE_AVATARS, type FemaleAvatar } from "../../constants/avatarsFemale";

type FemaleSelectAvatarRouteProp = RouteProp<AuthStackParamList, "FemaleSelectAvatar">;
type Nav = NativeStackNavigationProp<AuthStackParamList, "FemaleSelectAvatar">;

export default function FemaleSelectAvatarScreen() {
  const route = useRoute<FemaleSelectAvatarRouteProp>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const from = route.params?.from;
  const { avatarId, setAvatarId } = useOnboardingStore();
  const [selectedId, setSelectedId] = useState<string | null>(avatarId);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectAvatar = (id: string) => {
    setSelectedId(id);
  };

  const handleProceed = async () => {
    if (!selectedId) return;

    setIsLoading(true);
    setAvatarId(selectedId);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (from === "femaleCreateProfile") {
      navigation.goBack();
    } else {
      navigation.navigate("SelectLanguage");
    }
    setIsLoading(false);
  };

  const isButtonEnabled = selectedId !== null && !isLoading;

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

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Avatar</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>
              This will be displayed as your profile
            </Text>
            <Image
              source={require("../../../assets/images/info_icon.png")}
              style={styles.infoIcon}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Avatar Grid */}
        <View style={styles.gridContainer}>
          {FEMALE_AVATARS.map((avatar) => (
            <FemaleAvatarGridItem
              key={avatar.id}
              avatar={avatar}
              selected={selectedId === avatar.id}
              onSelect={() => handleSelectAvatar(avatar.id)}
            />
          ))}
        </View>

        {/* Bottom CTA Button */}
        <View
          style={[
            styles.buttonContainer,
            { paddingBottom: Math.max(insets.bottom, 32) },
          ]}
        >
          <Pressable
            onPress={handleProceed}
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
              Proceed
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

// Reusable Female Avatar Grid Item Component
interface FemaleAvatarGridItemProps {
  avatar: FemaleAvatar;
  selected: boolean;
  onSelect: () => void;
}

function FemaleAvatarGridItem({ avatar, selected, onSelect }: FemaleAvatarGridItemProps) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.avatarItem,
        selected && styles.avatarItemSelected,
        pressed && styles.avatarItemPressed,
      ]}
    >
      <View style={[styles.avatarCircle, selected && styles.avatarCircleSelected]}>
        <Image source={avatar.source} style={styles.avatarImage} resizeMode="cover" />
      </View>
    </Pressable>
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
  title: {
    ...typography.display.small,
    fontSize: 28,
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subtitle: {
    ...typography.body.medium,
    fontSize: 14,
    color: colors.text.secondary,
  },
  infoIcon: {
    width: 16,
    height: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  avatarItem: {
    width: "48%",
    marginBottom: 16,
    alignItems: "center",
  },
  avatarItemSelected: {
    // Container styling when selected (optional)
  },
  avatarItemPressed: {
    opacity: 0.8,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.input.border,
    overflow: "hidden",
    backgroundColor: colors.background.light,
  },
  avatarCircleSelected: {
    borderColor: colors.button.primary,
    borderWidth: 4,
    shadowColor: colors.button.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  buttonContainer: {
    paddingHorizontal: 0,
    marginTop: 24,
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
