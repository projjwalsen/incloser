import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useOnboardingStore } from "../../store/onboardingStore";
import GradientBackground from "../../components/GradientBackground";
import Checkbox from "../../components/Checkbox";
import { AVATARS } from "../../constants/avatars";

type Nav = NativeStackNavigationProp<AuthStackParamList, "CreateProfile">;

export default function CreateProfileScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { nickname, isAdultConfirmed, avatarId, setNickname, setAdultConfirmed } =
    useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleProceed = async () => {
    if (!nickname.trim() || !isAdultConfirmed) return;

    setIsLoading(true);
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    navigation.navigate("SelectLanguage");
    setIsLoading(false);
  };

  const handleChangeAvatar = () => {
    navigation.navigate("SelectAvatar", { from: "createProfile" });
  };

  // Get selected avatar source
  const selectedAvatar = AVATARS.find((a) => a.id === avatarId);
  const avatarSource = selectedAvatar
    ? selectedAvatar.source
    : require("../../../assets/images/male_profile.png");

  const isButtonEnabled = nickname.trim().length > 0 && isAdultConfirmed && !isLoading;

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
          <Text style={styles.headerTitle}>Create profile</Text>
          <View style={styles.backButton} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {/* Default avatar or selected avatar */}
              <Image
                source={avatarSource}
                style={styles.avatar}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handleChangeAvatar}
              >
                <Image
                  source={require("../../../assets/images/camera_icon.png")}
                  style={styles.cameraIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            <Pressable onPress={handleChangeAvatar}>
              <Text style={styles.changeAvatarText}>Change your avatar</Text>
            </Pressable>
          </View>

          {/* Nick Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Nick Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your nick name"
              placeholderTextColor={colors.input.placeholder}
              value={nickname}
              onChangeText={setNickname}
              maxLength={30}
            />
            <Text style={styles.helperText}>
              It's visible to every one. You can change this any time
            </Text>
          </View>

          {/* Age Checkbox */}
          <View style={styles.checkboxSection}>
            <Checkbox
              checked={isAdultConfirmed}
              onToggle={() => setAdultConfirmed(!isAdultConfirmed)}
              label="I am 18 or older. You must be 18 or older"
            />
          </View>
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

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
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
  content: {
    flex: 1,
    alignItems: "center",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background.light,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.button.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.background.white,
  },
  cameraIcon: {
    width: 20,
    height: 20,
  },
  changeAvatarText: {
    ...typography.body.medium,
    color: colors.link.primary,
    textDecorationLine: "underline",
  },
  inputSection: {
    width: "100%",
    marginBottom: 24,
  },
  inputLabel: {
    ...typography.body.medium,
    color: colors.text.primary,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    backgroundColor: colors.input.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.input.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...typography.body.medium,
    color: colors.text.primary,
  },
  helperText: {
    ...typography.body.small,
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  checkboxSection: {
    width: "100%",
    paddingVertical: 12,
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
