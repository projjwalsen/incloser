import React, { useRef } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import type { Dob } from "../store/onboardingStore";

interface DateOfBirthInputProps {
  dob: Dob;
  onChangeDob: (dob: Partial<Dob>) => void;
}

export default function DateOfBirthInput({ dob, onChangeDob }: DateOfBirthInputProps) {
  const mmRef = useRef<TextInput>(null);
  const yyyyRef = useRef<TextInput>(null);

  const handleDayChange = (text: string) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length <= 2) {
      onChangeDob({ dd: cleaned });
      // Auto-advance to month if 2 digits entered
      if (cleaned.length === 2) {
        mmRef.current?.focus();
      }
    }
  };

  const handleMonthChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length <= 2) {
      onChangeDob({ mm: cleaned });
      // Auto-advance to year if 2 digits entered
      if (cleaned.length === 2) {
        yyyyRef.current?.focus();
      }
    }
  };

  const handleYearChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length <= 4) {
      onChangeDob({ yyyy: cleaned });
    }
  };

  return (
    <View style={styles.dobContainer}>
      <TextInput
        style={styles.dobInput}
        placeholder="DD"
        placeholderTextColor={colors.input.placeholder}
        value={dob.dd}
        onChangeText={handleDayChange}
        keyboardType="number-pad"
        maxLength={2}
        returnKeyType="next"
        onSubmitEditing={() => mmRef.current?.focus()}
      />
      <Text style={styles.separator}>/</Text>
      <TextInput
        ref={mmRef}
        style={styles.dobInput}
        placeholder="MM"
        placeholderTextColor={colors.input.placeholder}
        value={dob.mm}
        onChangeText={handleMonthChange}
        keyboardType="number-pad"
        maxLength={2}
        returnKeyType="next"
        onSubmitEditing={() => yyyyRef.current?.focus()}
      />
      <Text style={styles.separator}>/</Text>
      <TextInput
        ref={yyyyRef}
        style={[styles.dobInput, styles.dobInputYear]}
        placeholder="YYYY"
        placeholderTextColor={colors.input.placeholder}
        value={dob.yyyy}
        onChangeText={handleYearChange}
        keyboardType="number-pad"
        maxLength={4}
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dobContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dobInput: {
    flex: 1,
    backgroundColor: colors.input.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.input.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...typography.body.medium,
    color: colors.text.primary,
    textAlign: "center",
  },
  dobInputYear: {
    flex: 1.5,
  },
  separator: {
    ...typography.body.medium,
    color: colors.text.secondary,
    fontSize: 18,
  },
});
