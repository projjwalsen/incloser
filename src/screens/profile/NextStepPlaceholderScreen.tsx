import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import GradientBackground from "../../components/GradientBackground";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useOnboardingStore } from "../../store/onboardingStore";

export default function NextStepPlaceholderScreen() {
  const navigation = useNavigation();
  const { reset } = useOnboardingStore();

  const handleReset = () => {
    reset();
    navigation.reset({
      index: 0,
      routes: [{ name: "Welcome" as never }],
    });
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.title}>🎉 Onboarding Complete!</Text>
        <Text style={styles.note}>
          This is a placeholder screen.{"\n"}
          Next steps: Home screen or main app flow.
        </Text>
        
        <Pressable onPress={handleReset} style={styles.button}>
          <Text style={styles.buttonText}>Reset & Start Over</Text>
        </Pressable>
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
    textAlign: "center",
  },
  note: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: colors.button.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  buttonText: {
    ...typography.button.medium,
    color: colors.text.white,
  },
});
