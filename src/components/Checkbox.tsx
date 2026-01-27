import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label?: string;
  disabled?: boolean;
}

export default function Checkbox({
  checked,
  onToggle,
  label,
  disabled = false,
}: CheckboxProps) {
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        pressed && !disabled && styles.containerPressed,
        disabled && styles.containerDisabled,
      ]}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  containerPressed: {
    opacity: 0.7,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.input.border,
    backgroundColor: colors.background.white,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    borderColor: colors.button.primary,
    backgroundColor: colors.button.primary,
  },
  checkmark: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: "700",
  },
  label: {
    ...typography.body.medium,
    color: colors.text.primary,
    flex: 1,
  },
});
