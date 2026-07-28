import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { CallInCallGradientAnimation } from "../../components/call/CallInCallGradientAnimation";
import { VIDEO_CALL_PREP_MS } from "../../config/agoraConfig";
import { usePreventScreenCapture } from "../../hooks/usePreventScreenCapture";
import type { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";

type Route = RouteProp<AuthStackParamList, "VideoCallPrep">;
type Nav = NativeStackNavigationProp<AuthStackParamList, "VideoCallPrep">;

export default function VideoCallPrepScreen() {
  usePreventScreenCapture();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const params = route.params;
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(VIDEO_CALL_PREP_MS / 1000));

  const variant = params.role === "caller" ? "male" : "female";

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    const timer = setTimeout(() => {
      navigation.replace("ActiveCall", {
        ...params,
        enableVideo: true,
      });
    }, VIDEO_CALL_PREP_MS);

    return () => {
      clearInterval(tick);
      clearTimeout(timer);
    };
  }, [navigation, params]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <CallInCallGradientAnimation variant={variant} />

      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        <View style={styles.videoBadge}>
          <Ionicons name="videocam" size={18} color={colors.text.white} />
          <Text style={styles.videoBadgeText}>Video call</Text>
        </View>

        <Text style={styles.title}>Getting ready</Text>
        <Text style={styles.subtitle}>
          Your video call with {params.remoteName} starts in
        </Text>

        <Text style={styles.countdown}>{secondsLeft}</Text>

        <View style={styles.avatarsRow}>
          {params.localAvatar != null ? (
            <Image source={params.localAvatar} style={styles.avatar} resizeMode="cover" />
          ) : null}
          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotMid]} />
            <View style={styles.dot} />
          </View>
          <Image source={params.remoteAvatar} style={styles.avatar} resizeMode="cover" />
        </View>

        <Text style={styles.hint}>Please stay on this screen</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.callCommunication.surface,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  videoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: colors.callCommunication.primary,
    marginBottom: 8,
  },
  videoBadgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: colors.text.white,
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 26,
    lineHeight: 32,
    color: colors.text.white,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    maxWidth: 280,
  },
  countdown: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 56,
    lineHeight: 64,
    color: colors.text.white,
    marginVertical: 16,
  },
  avatarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 8,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.callCommunication.primary,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.callCommunication.onlineStatus,
    opacity: 0.5,
  },
  dotMid: {
    opacity: 1,
    transform: [{ scale: 1.2 }],
  },
  hint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.5)",
    marginTop: 24,
  },
});
