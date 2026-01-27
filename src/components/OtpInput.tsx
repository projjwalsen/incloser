import React, { useRef, useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  onChange?: (otp: string) => void;
}

export default function OtpInput({
  length = 6,
  onComplete,
  onChange,
}: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Auto-focus first box on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (text: string, index: number) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, "");

    if (numericText.length === 0) {
      // Handle backspace
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      onChange?.(newOtp.join(""));

      // Move to previous box
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    // Handle paste or multiple digits
    if (numericText.length > 1) {
      // Paste detected - distribute across boxes
      const digits = numericText.slice(0, length).split("");
      const newOtp = [...otp];
      
      digits.forEach((digit, i) => {
        if (index + i < length) {
          newOtp[index + i] = digit;
        }
      });

      setOtp(newOtp);
      const otpString = newOtp.join("");
      onChange?.(otpString);

      // Focus last filled box or next empty box
      const nextIndex = Math.min(index + digits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();

      // Check if complete
      if (newOtp.every((digit) => digit !== "")) {
        onComplete(otpString);
      }
      return;
    }

    // Single digit input
    const newOtp = [...otp];
    newOtp[index] = numericText;
    setOtp(newOtp);
    const otpString = newOtp.join("");
    onChange?.(otpString);

    // Auto-advance to next box
    if (index < length - 1 && numericText.length > 0) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (newOtp.every((digit) => digit !== "")) {
      onComplete(otpString);
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    // Handle backspace on empty box
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          style={[
            styles.input,
            focusedIndex === index && styles.inputFocused,
          ]}
          value={otp[index]}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(null)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  input: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.input.border,
    backgroundColor: colors.input.background,
    ...typography.display.small,
    fontSize: 24,
    textAlign: "center",
    color: colors.text.primary,
  },
  inputFocused: {
    borderColor: colors.button.primary,
  },
});
