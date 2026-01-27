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
import DateOfBirthInput from "../../components/DateOfBirthInput";
import DropdownInput from "../../components/DropdownInput";
import { FEMALE_AVATARS } from "../../constants/avatarsFemale";
import { CITIES, STATES } from "../../constants/locations";

type Nav = NativeStackNavigationProp<AuthStackParamList, "FemaleCreateProfile">;

export default function FemaleCreateProfileScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {
    nickname,
    dob,
    city,
    state,
    isAdultConfirmed,
    avatarId,
    setNickname,
    setDob,
    setCity,
    setState,
    setAdultConfirmed,
  } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleChangeAvatar = () => {
    navigation.navigate("FemaleSelectAvatar", { from: "femaleCreateProfile" });
  };

  const handleSaveAndContinue = async () => {
    if (!isFormValid()) return;

    setIsLoading(true);
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    navigation.navigate("SelectLanguage");
    setIsLoading(false);
  };

  // Get selected avatar source (use female_profile as default)
  const selectedAvatar = FEMALE_AVATARS.find((a) => a.id === avatarId);
  const avatarSource = selectedAvatar
    ? selectedAvatar.source
    : require("../../../assets/images/female_profile.png");

  // Validation
  const isNicknameValid = nickname.trim().length > 0;
  const isDobValid =
    dob.dd.length === 2 &&
    dob.mm.length === 2 &&
    dob.yyyy.length === 4 &&
    parseInt(dob.dd) >= 1 &&
    parseInt(dob.dd) <= 31 &&
    parseInt(dob.mm) >= 1 &&
    parseInt(dob.mm) <= 12 &&
    parseInt(dob.yyyy) >= 1900 &&
    parseInt(dob.yyyy) <= new Date().getFullYear();
  const isCityValid = city.trim().length > 0;
  const isStateValid = state.trim().length > 0;

  const isFormValid = () =>
    isNicknameValid &&
    isDobValid &&
    isCityValid &&
    isStateValid &&
    isAdultConfirmed &&
    !isLoading;

  const isButtonEnabled = isFormValid();

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 20) },
        ]}
        keyboardShouldPersistTaps="handled"
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
          <Text style={styles.headerTitle}>Create Profile</Text>
          <View style={styles.backButton} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
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
            <View style={styles.labelRow}>
              <Image
                source={require("../../../assets/images/phone_icon.png")}
                style={styles.labelIcon}
                resizeMode="contain"
              />
              <Text style={styles.inputLabel}>Nick Name</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter your nick name"
              placeholderTextColor={colors.input.placeholder}
              value={nickname}
              onChangeText={setNickname}
              maxLength={30}
            />
          </View>

          {/* Date of Birth Input */}
          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <Text style={styles.labelIcon}>📅</Text>
              <Text style={styles.inputLabel}>Date of birth</Text>
            </View>
            <DateOfBirthInput dob={dob} onChangeDob={setDob} />
          </View>

          {/* City Dropdown */}
          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <Text style={styles.labelIcon}>📍</Text>
              <Text style={styles.inputLabel}>City</Text>
            </View>
            <DropdownInput
              placeholder="Select city"
              value={city}
              options={CITIES}
              onSelect={setCity}
            />
          </View>

          {/* State Dropdown */}
          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <Text style={styles.labelIcon}>🏛️</Text>
              <Text style={styles.inputLabel}>State</Text>
            </View>
            <DropdownInput
              placeholder="Select state"
              value={state}
              options={STATES}
              onSelect={setState}
            />
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
  content: {
    flex: 1,
    alignItems: "center",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
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
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  inputLabel: {
    ...typography.body.medium,
    color: colors.text.primary,
    fontWeight: "500",
  },
  labelIcon: {
    width: 16,
    height: 16,
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
