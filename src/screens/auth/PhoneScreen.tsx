import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useOnboardingStore } from "../../store/onboardingStore";
import { sendOtp } from "../../services/authApi";
import GradientBackground from "../../components/GradientBackground";
import CountryCodeSelector from "../../components/CountryCodeSelector";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Phone">;

export default function PhoneScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const phoneInputRef = useRef<TextInput>(null);
  
  const { phone, countryCode, setPhone, setCountryCode } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Validate phone number (India: 10 digits)
  const isValidPhone = (phoneNumber: string): boolean => {
    const cleaned = phoneNumber.replace(/\s/g, "");
    if (countryCode === "+91") {
      return cleaned.length === 10 && /^\d+$/.test(cleaned);
    }
    return cleaned.length >= 8 && /^\d+$/.test(cleaned);
  };

  const handlePhoneChange = (text: string) => {
    // Allow only numbers and spaces, auto-trim spaces
    const cleaned = text.replace(/[^\d\s]/g, "").trim();
    setPhone(cleaned);
    if (!hasInteracted && cleaned.length > 0) {
      setHasInteracted(true);
    }
  };

  const handleGetOtp = async () => {
    if (!isValidPhone(phone)) {
      setHasInteracted(true);
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const fullPhone = `${countryCode}${phone.replace(/\s/g, "")}`;
      const response = await sendOtp(fullPhone);
      
      if (response.success) {
        navigation.navigate("Otp", { phone: fullPhone });
      } else {
        // Handle error (could show toast/alert)
        console.error("Failed to send OTP:", response.message);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showError = hasInteracted && !isValidPhone(phone) && phone.length > 0;
  const isButtonEnabled = isValidPhone(phone) && !isLoading;

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: Math.max(insets.top, 40) },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Card Container */}
            <View style={styles.card}>
              {/* Title */}
              <Text style={styles.title}>Login / Sign up</Text>

              {/* Phone Input Row */}
              <View style={styles.phoneRow}>
                <CountryCodeSelector
                  selectedCode={countryCode}
                  onSelect={setCountryCode}
                />
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.phoneIcon}>📱</Text>
                  <TextInput
                    ref={phoneInputRef}
                    style={styles.phoneInput}
                    placeholder="Enter phone number"
                    placeholderTextColor={colors.input.placeholder}
                    value={phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    maxLength={countryCode === "+91" ? 10 : 15}
                    autoFocus={false}
                  />
                </View>
              </View>

              {/* Error Message */}
              {showError && (
                <Text style={styles.errorText}>
                  Please enter a valid {countryCode === "+91" ? "10-digit" : ""} phone number
                </Text>
              )}

              {/* Terms Text */}
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By continuing you agree to{" "}
                  <Text style={styles.linkText}>Incloser Terms of Use</Text>
                  {" "}and{" "}
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>
              </View>

              {/* Get OTP Button */}
              <Pressable
                onPress={handleGetOtp}
                disabled={!isButtonEnabled}
                style={({ pressed }) => [
                  styles.button,
                  !isButtonEnabled && styles.buttonDisabled,
                  pressed && isButtonEnabled && styles.buttonPressed,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.text.white} />
                ) : (
                  <Text
                    style={[
                      styles.buttonText,
                      !isButtonEnabled && styles.buttonTextDisabled,
                    ]}
                  >
                    Get OTP
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    ...typography.display.small,
    fontSize: 24,
    lineHeight: 32,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: 32,
  },
  phoneRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.input.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.input.border,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  phoneIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    ...typography.body.medium,
    color: colors.text.primary,
    padding: 0,
  },
  errorText: {
    ...typography.body.small,
    color: "#FF4444",
    marginTop: 4,
    marginBottom: 8,
    paddingLeft: 4,
  },
  termsContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  termsText: {
    ...typography.body.small,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text.secondary,
    textAlign: "center",
  },
  linkText: {
    color: colors.link.primary,
    textDecorationLine: "underline",
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
