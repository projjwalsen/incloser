import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useOnboardingStore } from "../../store/onboardingStore";
import { verifyOtp, sendOtp } from "../../services/authApi";
import GradientBackground from "../../components/GradientBackground";
import OtpInput from "../../components/OtpInput";

type OtpScreenRouteProp = RouteProp<AuthStackParamList, "Otp">;
type Nav = NativeStackNavigationProp<AuthStackParamList, "Otp">;

export default function OtpScreen() {
  const route = useRoute<OtpScreenRouteProp>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { phone } = route.params;
  const { setOtpVerified } = useOnboardingStore();

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (otpValue: string) => {
    setOtp(otpValue);
    setError(""); // Clear error on input change
  };

  const handleOtpComplete = (otpValue: string) => {
    setOtp(otpValue);
    // Auto-submit when complete (optional, or wait for button press)
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError("");
    Keyboard.dismiss();

    try {
      const response = await verifyOtp(phone, otp);

      if (response.success) {
        setOtpVerified(true);
        navigation.navigate("Gender");
      } else {
        setError(response.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
      console.error("Error verifying OTP:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    setError("");
    setResendSuccess(false);

    try {
      const response = await sendOtp(phone);

      if (response.success) {
        setCountdown(60);
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      } else {
        setError(response.message || "Failed to resend OTP");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
      console.error("Error resending OTP:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (phoneNumber: string) => {
    // Format phone number for display (e.g., +91 98765 43210)
    if (phoneNumber.startsWith("+91") && phoneNumber.length === 13) {
      return `+91 ${phoneNumber.slice(3, 8)} ${phoneNumber.slice(8)}`;
    }
    return phoneNumber;
  };

  const isButtonEnabled = otp.length === 6 && !isLoading;

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
            {/* Top Branding */}
            <View style={styles.brandingContainer}>
              <Image
                source={require("../../../assets/images/logo_square.png")}
                style={styles.brandingLogo}
                resizeMode="contain"
              />
            </View>

            {/* Card Container */}
            <View style={styles.card}>
              {/* Title */}
              <Text style={styles.title}>Enter OTP</Text>

              {/* Subtitle */}
              <Text style={styles.subtitle}>
                Please enter the 6 digit OTP that has been sent to{" "}
                {formatPhone(phone)}
              </Text>

              {/* OTP Input */}
              <View style={styles.otpContainer}>
                <OtpInput
                  length={6}
                  onComplete={handleOtpComplete}
                  onChange={handleOtpChange}
                />
              </View>

              {/* Error Message */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Resend Area */}
              <View style={styles.resendContainer}>
                {countdown > 0 ? (
                  <Text style={styles.resendText}>
                    Resend 6 digit OTP ?... After {countdown} second
                    {countdown !== 1 ? "s" : ""}
                  </Text>
                ) : (
                  <View style={styles.resendActionContainer}>
                    {resendSuccess && (
                      <Text style={styles.resendSuccessText}>OTP resent</Text>
                    )}
                    <Pressable onPress={handleResendOtp} disabled={isLoading}>
                      <Text style={styles.resendButtonText}>Resend OTP</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* Verify Button - Outside Card */}
            <View style={styles.buttonContainer}>
              <Pressable
                onPress={handleVerifyOtp}
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
                    Verify OTP
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
  brandingContainer: {
    alignItems: "center",
    marginBottom: 24,
    justifyContent: "center",
  },
  brandingLogo: {
    width: 194,
    height: 237,
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
    marginBottom: 40,
  },
  title: {
    ...typography.tagline,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  otpContainer: {
    marginBottom: 16,
  },
  errorText: {
    ...typography.body.small,
    color: "#FF4444",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  resendContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  resendText: {
    ...typography.body.small,
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: "center",
  },
  resendActionContainer: {
    alignItems: "center",
    gap: 4,
  },
  resendSuccessText: {
    ...typography.body.small,
    fontSize: 12,
    color: "#4CAF50",
    marginBottom: 4,
  },
  resendButtonText: {
    ...typography.body.medium,
    color: colors.link.primary,
    textDecorationLine: "underline",
  },
  buttonContainer: {
    paddingHorizontal: 0,
    marginTop: 8,
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
