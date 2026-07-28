import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { CallInCallGradientAnimation } from "./CallInCallGradientAnimation";
import { CallConnectionWave } from "./CallConnectionWave";
import { CallHeartFloatAnimation } from "./CallHeartFloatAnimation";
import { CallWalletBalanceChip } from "../billing/CallWalletBalanceChip";
import { colors } from "../../theme/colors";
import { hapticCallDrop } from "../../utils/haptics";
import { Pressable } from '../HapticPressable';

export type CallInProgressVariant = "female" | "male";

type CallInProgressLayoutProps = {
  variant: CallInProgressVariant;
  localAvatar: ImageSourcePropType;
  remoteAvatar: ImageSourcePropType;
  localLabel?: string;
  remoteName: string;
  statusLabel: string;
  isConnected?: boolean;
  muted: boolean;
  speakerOn: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onEndCall: () => void;
  /** Male voice call: switch to video when model supports it. */
  remoteSupportsVideo?: boolean;
  onTransferVideoCall?: () => void;
  /** Male caller: live wallet balance (top right). */
  walletBalanceInr?: number;
  onPressAddMoney?: () => void;
};

function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function CallAvatarColumn({
  source,
  label,
  ringColor,
}: {
  source: ImageSourcePropType;
  label: string;
  ringColor: string;
}) {
  return (
    <View style={styles.avatarColumn}>
      <View style={[styles.avatarRing, { borderColor: ringColor }]}>
        <Image source={source} style={styles.avatar} resizeMode="cover" />
      </View>
      <Text style={styles.avatarLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function ControlButton({
  label,
  active,
  onPress,
  children,
  large,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  large?: boolean;
}) {
  return (
    <Pressable style={styles.controlCol} onPress={onPress}>
      <View
        style={[
          styles.controlCircle,
          large && styles.controlCircleLarge,
          active && styles.controlCircleActive,
        ]}
      >
        {children}
      </View>
      <Text style={styles.controlLabel}>{label}</Text>
    </Pressable>
  );
}

export function CallInProgressLayout({
  variant,
  localAvatar,
  remoteAvatar,
  localLabel = "You",
  remoteName,
  statusLabel,
  isConnected = false,
  muted,
  speakerOn,
  onToggleMute,
  onToggleSpeaker,
  onEndCall,
  remoteSupportsVideo = false,
  onTransferVideoCall,
  walletBalanceInr,
  onPressAddMoney,
}: CallInProgressLayoutProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [elapsed, setElapsed] = useState(0);
  const isMale = variant === "male";

  const handlePressEnd = () => {
    if (isMale) {
      hapticCallDrop();
    }
    onEndCall();
  };

  const localRing =
    variant === "female" ? colors.callCommunication.primary : colors.femaleHome.logoBlue;
  const remoteRing =
    variant === "female" ? colors.femaleHome.logoBlue : colors.callCommunication.primary;

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const showOnCall = isConnected || statusLabel.toLowerCase().includes("on call");
  // Heart burst right after each minute mark (1:01, 2:01, ...).
  const heartBurstKey = isConnected ? Math.floor(Math.max(0, elapsed - 1) / 60) : 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <CallInCallGradientAnimation variant={variant} />
      {isConnected ? (
        <CallHeartFloatAnimation
          triggerKey={heartBurstKey}
          width={screenWidth}
          height={screenHeight}
        />
      ) : null}

      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleSide} />
          <Text style={styles.screenTitle}>Voice Call</Text>
          <View style={[styles.titleSide, styles.titleSideRight]}>
            {isMale && walletBalanceInr != null ? (
              <CallWalletBalanceChip
                balanceInr={walletBalanceInr}
                onPressAddMoney={onPressAddMoney}
              />
            ) : null}
          </View>
        </View>

        <View style={styles.statusRow}>
          {showOnCall ? <View style={styles.liveDot} /> : null}
          <Text style={[styles.statusText, showOnCall && styles.statusTextLive]}>
            {showOnCall ? "On call" : statusLabel}
          </Text>
        </View>

        <Text style={styles.timer}>{formatDuration(elapsed)}</Text>

        <View style={styles.avatarsBlock}>
          <View style={styles.avatarsRow}>
            <CallAvatarColumn
              source={localAvatar}
              label={localLabel}
              ringColor={localRing}
            />
            <View style={styles.waveSlot}>
              <CallConnectionWave />
            </View>
            <CallAvatarColumn
              source={remoteAvatar}
              label={remoteName}
              ringColor={remoteRing}
            />
          </View>
        </View>

        <View style={styles.bottomBlock}>
          <View style={styles.controlsBar}>
            <ControlButton
              label={muted ? "Unmute" : "Mute"}
              active={muted}
              onPress={onToggleMute}
            >
              <Ionicons
                name={muted ? "mic-off" : "mic"}
                size={22}
                color={colors.text.white}
              />
            </ControlButton>

            <Pressable style={styles.endCol} onPress={handlePressEnd}>
              <View style={styles.endCircle}>
                <Ionicons
                  name="call"
                  size={30}
                  color={colors.text.white}
                  style={styles.endIcon}
                />
              </View>
              <Text style={styles.controlLabel}>End</Text>
            </Pressable>

            <ControlButton
              label={speakerOn ? "Speaker" : "Earpiece"}
              active={speakerOn}
              onPress={onToggleSpeaker}
            >
              <Ionicons
                name={speakerOn ? "volume-high" : "volume-low"}
                size={22}
                color={colors.text.white}
              />
            </ControlButton>
          </View>

          {isMale ? (
            <View style={styles.transferBlock}>
              <Text style={styles.transferHeading}>Switch mode</Text>
              {remoteSupportsVideo && onTransferVideoCall ? (
                <Pressable
                  style={styles.transferCard}
                  onPress={onTransferVideoCall}
                  accessibilityRole="button"
                >
                  <View style={[styles.transferIconWrap, styles.transferIconVideo]}>
                    <Ionicons name="videocam" size={20} color={colors.text.white} />
                  </View>
                  <View style={styles.transferTextWrap}>
                    <Text style={styles.transferTitle}>Video call</Text>
                    <Text style={styles.transferSubtitle}>Start a video call</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="rgba(255,255,255,0.45)"
                  />
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const AVATAR_SIZE = 118;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.callCommunication.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    minHeight: 40,
  },
  titleSide: {
    width: 112,
    minHeight: 32,
  },
  titleSideRight: {
    alignItems: "flex-end",
  },
  screenTitle: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.5,
    color: colors.text.white,
    textAlign: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.callCommunication.onlineStatus,
  },
  statusText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.65)",
  },
  statusTextLive: {
    color: colors.callCommunication.onlineStatus,
  },
  timer: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: 1,
    color: colors.text.white,
    textAlign: "center",
    marginTop: 8,
  },
  avatarsBlock: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },
  avatarsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 4,
  },
  waveSlot: {
    height: AVATAR_SIZE + 12,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  avatarColumn: {
    alignItems: "center",
    width: 132,
    gap: 10,
  },
  avatarRing: {
    padding: 3,
    borderRadius: (AVATAR_SIZE + 10) / 2,
    borderWidth: 3,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.white,
    textAlign: "center",
    maxWidth: 132,
  },
  bottomBlock: {
    gap: 20,
  },
  controlsBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 28,
    paddingHorizontal: 8,
  },
  controlCol: {
    alignItems: "center",
    gap: 8,
    width: 72,
  },
  controlCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.callCommunication.statusCard,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlCircleLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  controlCircleActive: {
    backgroundColor: colors.callCommunication.primary,
    borderColor: colors.callCommunication.primary,
  },
  controlLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  endCol: {
    alignItems: "center",
    gap: 8,
    marginTop: -8,
  },
  endCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E53935",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  endIcon: {
    transform: [{ rotate: "135deg" }],
  },
  transferBlock: {
    gap: 10,
    paddingBottom: 4,
  },
  transferHeading: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.5,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginBottom: 2,
  },
  transferCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.callCommunication.statusCard,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  transferIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  transferIconVideo: {
    backgroundColor: colors.callCommunication.primary,
  },
  transferTextWrap: {
    flex: 1,
    gap: 2,
  },
  transferTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.white,
  },
  transferSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.5)",
  },
});
