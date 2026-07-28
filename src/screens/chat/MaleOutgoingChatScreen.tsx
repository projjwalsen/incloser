import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CallRingingLayout } from "../../components/call/CallRingingLayout";
import { usePreventScreenCapture } from "../../hooks/usePreventScreenCapture";
import type { AuthStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import {
  getChatSession,
  updateChatSessionStatus,
} from "../../services/supabase/chatSessions.service";
import { restoreModelAfterRemoteChatEnd } from "../../services/supabase/femaleCallBusy.service";

type Route = RouteProp<AuthStackParamList, "MaleOutgoingChat">;
type Nav = NativeStackNavigationProp<AuthStackParamList, "MaleOutgoingChat">;

const POLL_MS = 800;
const RING_TIMEOUT_MS = 25_000;
const DEFAULT_AVATAR = require("../../../assets/images/female_profile.png");

export default function MaleOutgoingChatScreen() {
  usePreventScreenCapture();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const callerUserId = useAuthStore((s) => s.session?.userId);
  const { sessionId, peerName, peerAvatar, callerAvatar } = route.params;
  const [statusText, setStatusText] = useState("Connecting…");
  const cancelledRef = useRef(false);
  const startedAtRef = useRef(Date.now());

  const avatarSource = peerAvatar ?? DEFAULT_AVATAR;

  const handleCancel = useCallback(async () => {
    cancelledRef.current = true;
    let receiverUserId: string | undefined;
    try {
      const row = await getChatSession(sessionId);
      receiverUserId = row?.receiver_user_id;
      await updateChatSessionStatus(sessionId, "cancelled");
    } catch {
      // ignore
    }
    if (receiverUserId) {
      try {
        await restoreModelAfterRemoteChatEnd(receiverUserId);
      } catch {
        // ignore
      }
    }
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation, sessionId]);

  useEffect(() => {
    if (!callerUserId) return;

    const poll = async () => {
      if (cancelledRef.current) return;
      const session = await getChatSession(sessionId);
      if (!session) return;

      if (
        session.status === "connecting" ||
        session.status === "active"
      ) {
        cancelledRef.current = true;
        navigation.replace("ActiveChat", {
          sessionId,
          role: "caller",
          remoteName: peerName,
          remoteAvatar: peerAvatar ?? DEFAULT_AVATAR,
          localAvatar: callerAvatar,
        });
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
          await updateChatSessionStatus(sessionId, "missed");
        } catch {
          // ignore
        }
        const receiverId = session.receiver_user_id;
        if (receiverId) {
          try {
            await restoreModelAfterRemoteChatEnd(receiverId);
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
  }, [callerAvatar, callerUserId, navigation, peerAvatar, peerName, sessionId]);

  return (
    <CallRingingLayout
      variant="light"
      title="Text chat"
      subtitle={statusText}
      name={peerName}
      avatarSource={avatarSource}
      hint="Waiting for her to join chat…"
      showCancel
      onCancel={() => void handleCancel()}
    />
  );
}
