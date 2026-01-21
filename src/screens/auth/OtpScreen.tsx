import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { AuthStackParamList } from "../../navigation/types";
import GradientBackground from "../../components/GradientBackground";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type OtpScreenRouteProp = RouteProp<AuthStackParamList, "Otp">;

export default function OtpScreen() {
  const route = useRoute<OtpScreenRouteProp>();
  const { phone } = route.params;

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.title}>OTP Screen</Text>
        <Text style={styles.phone}>Phone: {phone}</Text>
        <Text style={styles.note}>OTP screen implementation coming soon...</Text>
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
  phone: {
    ...typography.body.large,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  note: {
    ...typography.body.medium,
    color: colors.text.tertiary,
    textAlign: "center",
  },
});
