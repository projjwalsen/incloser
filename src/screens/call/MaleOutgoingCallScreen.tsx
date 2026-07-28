import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CallRingingLayout } from "../../components/call/CallRingingLayout";
import { usePreventScreenCapture } from "../../hooks/usePreventScreenCapture";
import type { AuthStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import {
  getCallSession,
  updateCallSessionStatus,
} from "../../services/supabase/callSessions.service";
import { restoreModelAfterRemoteCallEnd } from "../../services/supabase/femaleCallBusy.service";

type Route = RouteProp<AuthStackParamList, "MaleOutgoingCall">;
type Nav = NativeStackNavigationProp<AuthStackParamList, "MaleOutgoingCall">;

const POLL_MS = 800;
const RING_TIMEOUT_MS = 25_000;
const DEFAULT_AVATAR = require("../../../assets/images/female_profile.png");

export default function MaleOutgoingCallScreen() {
  usePreventScreenCapture();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const callerUserId = useAuthStore((s) => s.session?.userId);
  const {
    sessionId,
    calleeName,
    calleeAvatar,
    callerAvatar,
    callType,
    modelUserId,
    calleeSupportsVideo,
  } = route.params;
  const [statusText, setStatusText] = useState("Ringing…");
  const cancelledRef = useRef(false);
  const startedAtRef = useRef(Date.now());

  const avatarSource = calleeAvatar ?? DEFAULT_AVATAR;

  const handleCancel = useCallback(async () => {
    cancelledRef.current = true;
    let receiverUserId = modelUserId;
    try {
      const row = await getCallSession(sessionId);
      receiverUserId = row?.receiver_user_id ?? modelUserId;
      await updateCallSessionStatus(sessionId, "cancelled");
    } catch {
      // ignore
    }
    if (receiverUserId) {
      try {
        await restoreModelAfterRemoteCallEnd(receiverUserId);
      } catch {
        // ignore
      }
    }
    if (navigation.canGoBack()) navigation.goBack();
  }, [modelUserId, navigation, sessionId]);

  useEffect(() => {
    if (!callerUserId) return;

    const poll = async () => {
      if (cancelledRef.current) return;
      const session = await getCallSession(sessionId);
      if (!session) return;

      if (session.status === "connecting" || session.status === "active") {
        cancelledRef.current = true;
        setStatusText("Connected");
        const shared = {
          sessionId,
          channelName: session.channel_name,
          role: "caller" as const,
          remoteName: calleeName,
          remoteAvatar: calleeAvatar ?? DEFAULT_AVATAR,
          localAvatar: callerAvatar,
        };
        if (callType === "video") {
          navigation.replace("VideoCallPrep", {
            ...shared,
            callType: "video",
          });
        } else {
          navigation.replace("ActiveCall", {
            ...shared,
            callType: "voice",
            enableVideo: false,
            remoteUserId: modelUserId,
            remoteSupportsVideo: calleeSupportsVideo ?? false,
          });
        }
        return;
      }

      if (
        session.status === "ended" ||
        session.status === "cancelled" ||
        session.status === "missed"
      ) {
        setStatusText("Unavailable");
        setTimeout(() => {
          if (navigation.canGoBack()) navigation.goBack();
        }, 1200);
        return;
      }

      if (
        session.status === "ringing" &&
        Date.now() - startedAtRef.current > RING_TIMEOUT_MS
      ) {
        cancelledRef.current = true;
        setStatusText("No response — try again");
        try {
          await updateCallSessionStatus(sessionId, "missed");
        } catch {
          // ignore
        }
        const receiverId = session.receiver_user_id ?? modelUserId;
        if (receiverId) {
          try {
            await restoreModelAfterRemoteCallEnd(receiverId);
          } catch {
            // ignore
          }
        }
        setTimeout(() => {
          if (navigation.canGoBack()) navigation.goBack();
        }, 1500);
      }
    };

    void poll();
    const id = setInterval(() => void poll(), POLL_MS);
    return () => clearInterval(id);
  }, [
    callType,
    calleeAvatar,
    calleeName,
    calleeSupportsVideo,
    callerAvatar,
    callerUserId,
    modelUserId,
    navigation,
    sessionId,
  ]);

  return (
    <CallRingingLayout
      variant="light"
      title={callType === "video" ? "Video call" : "Voice call"}
      subtitle={statusText}
      name={calleeName}
      avatarSource={avatarSource}
      hint={
        callType === "video"
          ? "Waiting for her to join video…"
          : "Waiting for her to answer…"
      }
      showCancel
      onCancel={() => void handleCancel()}
    />
  );
}
