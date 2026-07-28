import React, { useEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CallRingingLayout } from "../../components/call/CallRingingLayout";
import { INCOMING_AUTO_ANSWER_MS } from "../../config/agoraConfig";
import { updateChatSessionStatus } from "../../services/supabase/chatSessions.service";
import {
  ensureModelDiscoverableAfterCall,
  setModelBusyForCall,
} from "../../services/supabase/femaleCallBusy.service";
import { MODEL_ONLINE_STATUS } from "../../services/supabase/femaleOnlineStatus.service";
import { AVATARS } from "../../constants/avatars";
import { useAuthStore } from "../../store/authStore";
import { useFemaleChatStore } from "../../store/femaleChatStore";
import { useOnboardingStore } from "../../store/onboardingStore";
import { FEMALE_AVATARS } from "../../constants/avatarsFemale";
import { usePreventScreenCapture } from "../../hooks/usePreventScreenCapture";
import type { AuthStackParamList } from "../../navigation/types";

type Route = RouteProp<AuthStackParamList, "FemaleIncomingChat">;
type Nav = NativeStackNavigationProp<AuthStackParamList, "FemaleIncomingChat">;

export default function FemaleIncomingChatScreen() {
  usePreventScreenCapture();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { sessionId, callerName, callerAvatarId } = route.params;
  const [secondsLeft, setSecondsLeft] = useState(
    Math.ceil(INCOMING_AUTO_ANSWER_MS / 1000)
  );
  const answeredRef = useRef(false);
  const setChatPhase = useFemaleChatStore((s) => s.setChatPhase);
  const setStatusBeforeChat = useFemaleChatStore((s) => s.setStatusBeforeChat);
  const sessionUserId = useAuthStore((s) => s.session?.userId);
  const { avatarId } = useOnboardingStore();

  useEffect(() => {
    setChatPhase("in_chat");
    if (!sessionUserId) return;

    void (async () => {
      const previous = await setModelBusyForCall(sessionUserId);
      if (previous) setStatusBeforeChat(previous);
      else if (!useFemaleChatStore.getState().statusBeforeChat) {
        setStatusBeforeChat(MODEL_ONLINE_STATUS.TEXT);
      }
    })();

    return () => {
      if (!answeredRef.current) {
        setChatPhase("online");
        if (sessionUserId) {
          void ensureModelDiscoverableAfterCall(
            sessionUserId,
            useFemaleChatStore.getState().statusBeforeChat ?? MODEL_ONLINE_STATUS.TEXT
          );
        }
      }
    };
  }, [sessionUserId, setChatPhase, setStatusBeforeChat]);

  const avatarSource =
    AVATARS.find((a) => a.id === callerAvatarId)?.source ?? AVATARS[0]?.source;

  useEffect(() => {
    const countdown = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    const timer = setTimeout(() => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      void (async () => {
        try {
          await updateChatSessionStatus(sessionId, "connecting");
          await updateChatSessionStatus(sessionId, "active");
        } catch {
          // continue
        }
        const localSource =
          FEMALE_AVATARS.find((a) => a.id === avatarId)?.source ??
          FEMALE_AVATARS[0]?.source;
        navigation.replace("ActiveChat", {
          sessionId,
          role: "receiver",
          remoteName: callerName,
          remoteAvatar: avatarSource,
          localAvatar: localSource,
        });
      })();
    }, INCOMING_AUTO_ANSWER_MS);

    return () => {
      clearTimeout(timer);
      clearInterval(countdown);
    };
  }, [avatarId, avatarSource, callerName, navigation, sessionId]);

  return (
    <CallRingingLayout
      variant="dark"
      title="Incoming chat"
      subtitle={secondsLeft > 0 ? `Connecting in ${secondsLeft}s…` : "Connecting…"}
      name={callerName}
      avatarSource={avatarSource}
      hint="Text chat"
    />
  );
}
