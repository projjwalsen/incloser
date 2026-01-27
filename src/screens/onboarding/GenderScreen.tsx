import React from "react";
import { View, Text, StyleSheet } from "react-native";
import GradientBackground from "../../components/GradientBackground";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export default function GenderScreen() {
  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Gender Screen</Text>
        <Text style={styles.note}>Gender selection screen implementation coming soon...</Text>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    ...typography.display.medium,
    color: colors.text.primary,
    marginBottom: 16,
  },
  note: {
    ...typography.body.medium,
    color: colors.text.tertiary,
    textAlign: "center",
  },
});
