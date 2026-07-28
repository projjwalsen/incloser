import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { CallInCallGradientAnimation } from "./CallInCallGradientAnimation";
import { CallHeartFloatAnimation } from "./CallHeartFloatAnimation";
import {
  AGORA_LOCAL_PREVIEW_UID,
  getAgoraRemoteUid,
} from "../../services/agora/agoraCall.service";
import { CallWalletBalanceChip } from "../billing/CallWalletBalanceChip";
import { colors } from "../../theme/colors";
import { hapticCallDrop } from "../../utils/haptics";
import { Pressable } from '../HapticPressable';

type VideoCallInProgressLayoutProps = {
  variant: "female" | "male";
  localAvatar: ImageSourcePropType;
  remoteAvatar: ImageSourcePropType;
  remoteName: string;
  timerLabel: string;
  statusLabel: string;
  remoteJoined: boolean;
  /** True after Agora join succeeded with video enabled. */
  localVideoReady?: boolean;
  muted: boolean;
  speakerOn: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onEndCall: () => void;
  onFlipCamera?: () => void;
  walletBalanceInr?: number;
  onPressAddMoney?: () => void;
};

function AgoraVideoView({
  uid,
  style,
  isLocal = false,
}: {
  uid: number;
  style: object;
  isLocal?: boolean;
}) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RtcSurfaceView, VideoSourceType } = require("react-native-agora") as {
      RtcSurfaceView: React.ComponentType<{
        style: object;
        canvas: { uid: number; sourceType?: number };
        zOrderOnTop?: boolean;
      }>;
      VideoSourceType: { VideoSourceCamera: number };
    };
    const canvas = isLocal
      ? { uid: AGORA_LOCAL_PREVIEW_UID, sourceType: VideoSourceType.VideoSourceCamera }
      : { uid };
    return (
      <RtcSurfaceView
        style={style}
        canvas={canvas}
        zOrderOnTop={isLocal}
      />
    );
  } catch {
    return null;
  }
}

export function VideoCallInProgressLayout({
  variant,
  localAvatar,
  remoteAvatar,
  remoteName,
  timerLabel,
  statusLabel,
  remoteJoined,
  localVideoReady = false,
  muted,
  speakerOn,
  onToggleMute,
  onToggleSpeaker,
  onEndCall,
  onFlipCamera,
  walletBalanceInr,
  onPressAddMoney,
}: VideoCallInProgressLayoutProps) {
  const showWallet =
    variant === "male" && walletBalanceInr != null;
  const isMale = variant === "male";
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const remoteAgoraUid = getAgoraRemoteUid();
  const showRemoteVideo = remoteJoined && remoteAgoraUid > 0;
  const showLocalVideo = localVideoReady;

  const [elapsedSec, setElapsedSec] = useState(0);
  const handlePressEnd = () => {
    if (isMale) {
      hapticCallDrop();
    }
    onEndCall();
  };
  useEffect(() => {
    if (!remoteJoined) {
      setElapsedSec(0);
      return;
    }
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [remoteJoined]);
  const heartBurstKey = remoteJoined
    ? Math.floor(Math.max(0, elapsedSec - 1) / 60)
    : 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <CallInCallGradientAnimation variant={variant} />
      {remoteJoined ? (
        <CallHeartFloatAnimation
          triggerKey={heartBurstKey}
          width={screenWidth}
          height={screenHeight}
        />
      ) : null}

      <View style={styles.remoteStage}>
        {showRemoteVideo ? (
          <AgoraVideoView uid={remoteAgoraUid} style={styles.remoteVideo} />
        ) : (
          <Image source={remoteAvatar} style={styles.remoteFallback} resizeMode="cover" />
        )}
        <View style={styles.remoteOverlay} />
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
          <View style={styles.topBarSide} />
          <View style={styles.topBarCenter}>
            <View style={styles.livePill}>
              <Ionicons name="videocam" size={14} color={colors.text.white} />
              <Text style={styles.liveText}>Video</Text>
            </View>
            <Text style={styles.timer}>{timerLabel}</Text>
            <Text style={styles.status}>{statusLabel}</Text>
          </View>
          <View style={[styles.topBarSide, styles.topBarSideRight]}>
            {showWallet ? (
              <CallWalletBalanceChip
                balanceInr={walletBalanceInr}
                onPressAddMoney={onPressAddMoney}
              />
            ) : null}
          </View>
        </View>
        <Text style={styles.remoteName}>{remoteName}</Text>
      </View>

      <View style={[styles.localPip, { top: Math.max(insets.top, 12) + 118 }]}>
        {showLocalVideo ? (
          <AgoraVideoView
            uid={AGORA_LOCAL_PREVIEW_UID}
            style={styles.localVideo}
            isLocal
          />
        ) : (
          <Image source={localAvatar} style={styles.localFallback} resizeMode="cover" />
        )}
        <Text style={styles.pipLabel}>You</Text>
      </View>

      <View style={[styles.toolbar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable style={styles.toolBtn} onPress={onToggleMute}>
          <View style={[styles.toolCircle, muted && styles.toolCircleActive]}>
            <Ionicons name={muted ? "mic-off" : "mic"} size={22} color={colors.text.white} />
          </View>
          <Text style={styles.toolLabel}>Mute</Text>
        </Pressable>

        <Pressable
          style={styles.toolBtn}
          onPress={onFlipCamera}
          disabled={!onFlipCamera}
        >
          <View style={[styles.toolCircle, !onFlipCamera && styles.toolCircleDisabled]}>
            <Ionicons name="camera-reverse" size={22} color={colors.text.white} />
          </View>
          <Text style={styles.toolLabel}>Flip</Text>
        </Pressable>

        <Pressable style={styles.endWrap} onPress={handlePressEnd}>
          <View style={styles.endCircle}>
            <Ionicons
              name="call"
              size={28}
              color={colors.text.white}
              style={styles.endIcon}
            />
          </View>
          <Text style={styles.toolLabel}>End</Text>
        </Pressable>

        <Pressable style={styles.toolBtn} onPress={onToggleSpeaker}>
          <View style={[styles.toolCircle, speakerOn && styles.toolCircleActive]}>
            <Ionicons
              name={speakerOn ? "volume-high" : "volume-low"}
              size={22}
              color={colors.text.white}
            />
          </View>
          <Text style={styles.toolLabel}>Speaker</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.callCommunication.surface,
  },
  remoteStage: {
    flex: 1,
    backgroundColor: "#0d1018",
    justifyContent: "flex-end",
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  remoteFallback: {
    ...StyleSheet.absoluteFillObject,
  },
  remoteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    zIndex: 4,
  },
  topBarSide: {
    width: 112,
    minHeight: 32,
  },
  topBarSideRight: {
    alignItems: "flex-end",
  },
  topBarCenter: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.callCommunication.primary,
  },
  liveText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: colors.text.white,
  },
  timer: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 22,
    color: colors.text.white,
    textAlign: "center",
    width: "100%",
  },
  status: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: colors.callCommunication.onlineStatus,
    textAlign: "center",
    width: "100%",
  },
  remoteName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 18,
    color: colors.text.white,
    textAlign: "center",
    paddingBottom: 24,
    zIndex: 2,
  },
  localPip: {
    position: "absolute",
    right: 16,
    width: 108,
    height: 148,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.callCommunication.primary,
    backgroundColor: "#1a1f2e",
    zIndex: 3,
  },
  localVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  localFallback: {
    width: "100%",
    height: 120,
  },
  pipLabel: {
    position: "absolute",
    bottom: 6,
    left: 8,
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: colors.text.white,
    zIndex: 2,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "rgba(22, 25, 38, 0.95)",
  },
  toolBtn: {
    width: 64,
    alignItems: "center",
    gap: 6,
  },
  toolCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.callCommunication.statusCard,
    alignItems: "center",
    justifyContent: "center",
  },
  toolCircleActive: {
    backgroundColor: colors.callCommunication.primary,
  },
  toolCircleDisabled: {
    opacity: 0.45,
  },
  toolLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
  },
  endWrap: {
    alignItems: "center",
    gap: 6,
    marginTop: -12,
  },
  endCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
  },
  endIcon: {
    transform: [{ rotate: "135deg" }],
  },
});
