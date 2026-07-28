import React, { useEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Audio } from "expo-av";
import { CallRingingLayout } from "../../components/call/CallRingingLayout";
import { INCOMING_CALL_RINGTONE } from "../../constants/callSounds";
import { INCOMING_AUTO_ANSWER_MS } from "../../config/agoraConfig";
import { usePreventScreenCapture } from "../../hooks/usePreventScreenCapture";
import { updateCallSessionStatus } from "../../services/supabase/callSessions.service";
import { AVATARS } from "../../constants/avatars";
import { useFemaleCallStore } from "../../store/femaleCallStore";
import { useOnboardingStore } from "../../store/onboardingStore";
import { FEMALE_AVATARS } from "../../constants/avatarsFemale";
import type { AuthStackParamList } from "../../navigation/types";

type Route = RouteProp<AuthStackParamList, "FemaleIncomingCall">;
type Nav = NativeStackNavigationProp<AuthStackParamList, "FemaleIncomingCall">;

export default function FemaleIncomingCallScreen() {
  usePreventScreenCapture();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { sessionId, channelName, callerName, callerAvatarId, callType } = route.params;
  const [secondsLeft, setSecondsLeft] = useState(
    Math.ceil(INCOMING_AUTO_ANSWER_MS / 1000)
  );
  const answeredRef = useRef(false);
  const ringtoneRef = useRef<Audio.Sound | null>(null);
  const setCallPhase = useFemaleCallStore((s) => s.setCallPhase);
  const { avatarId } = useOnboardingStore();

  useEffect(() => {
    setCallPhase("in_call");
    return () => {
      void (async () => {
        const sound = ringtoneRef.current;
        ringtoneRef.current = null;
        if (!sound) return;
        try {
          await sound.stopAsync();
        } catch {
          // ignore
        }
        try {
          await sound.unloadAsync();
        } catch {
          // ignore
        }
      })();
      if (!answeredRef.current) {
        setCallPhase("online");
      }
    };
  }, [setCallPhase]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          INCOMING_CALL_RINGTONE,
          { isLooping: true, shouldPlay: true, volume: 1 }
        );
        if (!mounted) {
          await sound.unloadAsync();
          return;
        }
        ringtoneRef.current = sound;
      } catch (e) {
        if (__DEV__) {
          console.warn("[FemaleIncomingCall] ringtone failed", e);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
          await updateCallSessionStatus(sessionId, "connecting");
        } catch {
          // continue
        }
        const sound = ringtoneRef.current;
        ringtoneRef.current = null;
        if (sound) {
          try {
            await sound.stopAsync();
          } catch {
            // ignore
          }
          try {
            await sound.unloadAsync();
          } catch {
            // ignore
          }
        }
        const localSource =
          FEMALE_AVATARS.find((a) => a.id === avatarId)?.source ??
          FEMALE_AVATARS[0]?.source;
        const shared = {
          sessionId,
          channelName,
          role: "receiver" as const,
          remoteName: callerName,
          remoteAvatar: avatarSource,
          localAvatar: localSource,
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
          });
        }
      })();
    }, INCOMING_AUTO_ANSWER_MS);

    return () => {
      clearTimeout(timer);
      clearInterval(countdown);
    };
  }, [avatarId, avatarSource, callType, callerName, channelName, navigation, sessionId]);

  return (
    <CallRingingLayout
      variant="dark"
      title={callType === "video" ? "Incoming video call" : "Incoming call"}
      subtitle={secondsLeft > 0 ? `Connecting in ${secondsLeft}s…` : "Connecting…"}
      name={callerName}
      avatarSource={avatarSource}
      hint={callType === "video" ? "Video call" : "Voice call"}
    />
  );
}
