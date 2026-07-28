import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CallInProgressLayout } from "../../components/call/CallInProgressLayout";
import { VideoCallInProgressLayout } from "../../components/call/VideoCallInProgressLayout";
import { MaleVideoCallConfirmModal } from "../../components/maleHome/MaleVideoCallConfirmModal";
import type { AuthStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import { useOnboardingStore } from "../../store/onboardingStore";
import { useFemaleCallStore } from "../../store/femaleCallStore";
import {
  joinAgoraVoiceChannel,
  leaveAgoraChannel,
  setAgoraMuted,
  setAgoraSpeakerphone,
  switchAgoraCamera,
  isAgoraNativeAvailable,
} from "../../services/agora/agoraCall.service";
import {
  getCallSession,
  updateCallSessionStatus,
  upgradeCallSessionToVideo,
} from "../../services/supabase/callSessions.service";
import { requestCameraPermission } from "../../services/callPermissions.service";
import {
  ensureModelDiscoverableAfterCall,
  restoreModelAfterRemoteCallEnd,
  restoreModelStatusAfterCall,
  setModelBusyForCall,
  setModelOfflineAfterFemaleEndedCall,
} from "../../services/supabase/femaleCallBusy.service";
import { MODEL_ONLINE_STATUS } from "../../services/supabase/femaleOnlineStatus.service";
import { useModelPresenceHeartbeat } from "../../hooks/useModelPresenceHeartbeat";
import { useSessionBilling } from "../../hooks/useSessionBilling";
import { useBillingRate } from "../../hooks/useBillingSettings";
import {
  finalizeSessionBilling,
  type FinalizeBillingResult,
} from "../../services/supabase/billing.service";
import { SessionBillingBanner } from "../../components/billing/SessionBillingBanner";
import { type ModelEarningsSummary } from "../../components/billing/ModelSessionEarningsModal";
import {
  type MaleSpendingSummary,
} from "../../components/billing/MaleSessionSpendingModal";
import { AVATARS } from "../../constants/avatars";
import { FEMALE_AVATARS } from "../../constants/avatarsFemale";
import { useMaleSessionStore } from "../../store/maleSessionStore";
import { usePreventScreenCapture } from "../../hooks/usePreventScreenCapture";
import { hapticCallDrop } from "../../utils/haptics";

type Route = RouteProp<AuthStackParamList, "ActiveCall">;
type Nav = NativeStackNavigationProp<AuthStackParamList, "ActiveCall">;

const DEFAULT_FEMALE =
  FEMALE_AVATARS[0]?.source ?? require("../../../assets/images/female_profile.png");
const DEFAULT_MALE = AVATARS[0]?.source;

export default function ActiveCallScreen() {
  usePreventScreenCapture();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const userId = useAuthStore((s) => s.session?.userId);
  const { avatarId } = useOnboardingStore();
  const setCallPhase = useFemaleCallStore((s) => s.setCallPhase);
  const endCallSession = useFemaleCallStore((s) => s.endCallSession);
  const statusBeforeCall = useFemaleCallStore((s) => s.statusBeforeCall);
  const onlineAllowsVideo = useFemaleCallStore((s) => s.onlineAllowsVideo);
  const setStatusBeforeCall = useFemaleCallStore((s) => s.setStatusBeforeCall);
  const setPendingFemaleEarnings = useFemaleCallStore((s) => s.setPendingEarnings);
  const setPendingMaleSpending = useMaleSessionStore((s) => s.setPendingSpending);

  const {
    sessionId,
    channelName,
    callType,
    role,
    remoteName,
    remoteAvatar,
    localAvatar,
    enableVideo,
    remoteSupportsVideo = false,
    remoteUserId,
  } = route.params;

  const [statusLabel, setStatusLabel] = useState("Connecting…");
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [busyApplied, setBusyApplied] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [billingElapsed, setBillingElapsed] = useState(0);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [upgradingToVideo, setUpgradingToVideo] = useState(false);
  const [localVideoReady, setLocalVideoReady] = useState(false);
  const upgradingToVideoRef = useRef(false);
  const statusBeforeCallRef = useRef(statusBeforeCall);
  const mountedAtRef = useRef(Date.now());
  const endedHandledRef = useRef(false);

  useEffect(() => {
    statusBeforeCallRef.current = statusBeforeCall;
  }, [statusBeforeCall]);

  const variant = role === "caller" ? "male" : "female";
  const isVideoCall = callType === "video" || enableVideo === true;
  const videoRateInrPerMin = useBillingRate("video");
  const billingMode = isVideoCall ? "video" : "voice";
  const isCaller = role === "caller";

  const resolvedLocalAvatar = useMemo(() => {
    if (localAvatar != null) return localAvatar;
    if (role === "receiver") {
      const match = FEMALE_AVATARS.find((a) => a.id === avatarId);
      return match?.source ?? DEFAULT_FEMALE;
    }
    const match = AVATARS.find((a) => a.id === avatarId);
    return match?.source ?? DEFAULT_MALE;
  }, [avatarId, localAvatar, role]);

  const resolvedRemoteAvatar =
    remoteAvatar ?? (role === "caller" ? DEFAULT_FEMALE : DEFAULT_MALE);

  const resolveRestoreStatus = useCallback(() => {
    const store = useFemaleCallStore.getState();
    const saved = statusBeforeCallRef.current ?? store.statusBeforeCall;
    if (saved && saved !== MODEL_ONLINE_STATUS.BUSY) {
      return saved;
    }
    if (store.onlineAllowsVideo) {
      return MODEL_ONLINE_STATUS.VOICE_AND_VIDEO;
    }
    return MODEL_ONLINE_STATUS.VOICE_CALL;
  }, []);

  const buildModelEarningsSummary = useCallback(
    (result: FinalizeBillingResult): ModelEarningsSummary => ({
      sessionKind: "call",
      remoteName,
      mode: result.mode ?? billingMode,
      upgraded: result.upgraded,
      durationSeconds: result.durationSeconds ?? 0,
      modelMinutes: result.modelMinutes ?? 0,
      modelEarningInr: result.modelEarningInr ?? 0,
      modelVoiceMinutes: result.modelVoiceMinutes,
      modelVideoMinutes: result.modelVideoMinutes,
      modelVoiceInr: result.modelVoiceInr,
      modelVideoInr: result.modelVideoInr,
      rateInrPerMin: result.rateInrPerMin,
      voiceRateInrPerMin: result.voiceRateInrPerMin,
      videoRateInrPerMin: result.videoRateInrPerMin,
      sharePercent: result.sharePercent,
    }),
    [billingMode, remoteName]
  );

  const buildMaleSpendingSummary = useCallback(
    (
      result: FinalizeBillingResult,
      balanceAfterInr?: number,
      modelUserId?: string
    ): MaleSpendingSummary => ({
      sessionKind: "call",
      remoteName,
      sessionId,
      callSessionId: sessionId,
      modelUserId,
      callerUserId: userId ?? undefined,
      mode: result.mode ?? billingMode,
      upgraded: result.upgraded,
      durationSeconds: result.durationSeconds ?? 0,
      callerChargedMinutes: result.callerChargedMinutes ?? 0,
      callerTotalDebitedInr: result.callerTotalDebitedInr ?? 0,
      callerVoiceMinutes: result.callerVoiceMinutes,
      callerVideoMinutes: result.callerVideoMinutes,
      callerVoiceInr: result.callerVoiceInr,
      callerVideoInr: result.callerVideoInr,
      rateInrPerMin: result.rateInrPerMin,
      voiceRateInrPerMin: result.voiceRateInrPerMin,
      videoRateInrPerMin: result.videoRateInrPerMin,
      balanceAfterInr,
    }),
    [billingMode, remoteName, sessionId, userId]
  );

  /** Park the model's earnings in the store so the next screen can show the popup. */
  const queueFemaleEarnings = useCallback(
    (result: FinalizeBillingResult) => {
      if (role !== "receiver" || !result.ok) return;
      const summary = buildModelEarningsSummary(result);
      // Only queue if there is something meaningful to show (covers $0 short calls too).
      setPendingFemaleEarnings(summary);
    },
    [buildModelEarningsSummary, role, setPendingFemaleEarnings]
  );

  const queueMaleSpending = useCallback(
    (result: FinalizeBillingResult, balanceAfterInr?: number, modelUserId?: string) => {
      if (role !== "caller" || !result.ok) return;
      // Skip popup for zero-billed sessions (call never connected for a full minute).
      if ((result.callerChargedMinutes ?? 0) === 0) return;
      setPendingMaleSpending(
        buildMaleSpendingSummary(result, balanceAfterInr, modelUserId ?? remoteUserId)
      );
    },
    [buildMaleSpendingSummary, remoteUserId, role, setPendingMaleSpending]
  );

  const restoreFemaleAfterRemoteEnded = useCallback(async () => {
    if (role !== "receiver" || !userId) return;
    if (endedHandledRef.current) return;

    let billingResult: FinalizeBillingResult = { ok: false };
    try {
      billingResult = await finalizeSessionBilling("call", sessionId);
    } catch (e) {
      if (__DEV__) console.warn("[ActiveCall] finalize on remote end", e);
    }

    // Queue earnings — the waiting screen will pick this up and show the modal.
    queueFemaleEarnings(billingResult);

    const restoreTo = resolveRestoreStatus();
    try {
      await restoreModelStatusAfterCall(userId, restoreTo);
      await ensureModelDiscoverableAfterCall(userId, restoreTo);
    } catch (e) {
      if (__DEV__) {
        console.warn("[ActiveCall] restoreModelStatusAfterCall failed", e);
      }
      await ensureModelDiscoverableAfterCall(userId, restoreTo);
    }

    endedHandledRef.current = true;
    setStatusBeforeCall(null);
    setBusyApplied(false);
    setCallPhase("online");

    const waitingRoute =
      restoreTo === MODEL_ONLINE_STATUS.TEXT
        ? ("FemaleChatActive" as const)
        : ("FemaleCallActive" as const);

    navigation.reset({
      index: 1,
      routes: [{ name: "FemaleHome" }, { name: waitingRoute }],
    });
  }, [
    navigation,
    queueFemaleEarnings,
    resolveRestoreStatus,
    role,
    sessionId,
    setCallPhase,
    setStatusBeforeCall,
    userId,
  ]);

  const finishFemaleSelfEndedCall = useCallback(async () => {
    if (role !== "receiver" || !userId) return;
    await setModelOfflineAfterFemaleEndedCall(userId);
    endCallSession();
    setBusyApplied(false);
    navigation.reset({
      index: 0,
      routes: [{ name: "FemaleHome" }],
    });
  }, [endCallSession, navigation, role, userId]);

  const finishFemaleSelfEndedCallRef = useRef(finishFemaleSelfEndedCall);
  finishFemaleSelfEndedCallRef.current = finishFemaleSelfEndedCall;

  const restoreFemaleAfterRemoteEndedRef = useRef(restoreFemaleAfterRemoteEnded);
  restoreFemaleAfterRemoteEndedRef.current = restoreFemaleAfterRemoteEnded;

  const finishCallerNavigation = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.reset({
      index: 0,
      routes: [{ name: "MaleHome" }],
    });
  }, [navigation]);

  const endCall = useCallback(async () => {
    if (role === "caller") {
      hapticCallDrop();
    }
    leaveAgoraChannel();
    endedHandledRef.current = true;

    // --- Receiver (female) hung up ---
    if (role === "receiver") {
      try {
        await updateCallSessionStatus(sessionId, "ended");
      } catch {
        // ignore
      }
      let billingResult: FinalizeBillingResult = { ok: false };
      try {
        billingResult = await finalizeSessionBilling("call", sessionId);
      } catch (e) {
        if (__DEV__) console.warn("[ActiveCall] billing finalize", e);
      }
      // Park earnings — the FemaleHome (dashboard) will show the popup since
      // self-ended calls also take the model offline.
      queueFemaleEarnings(billingResult);
      void finishFemaleSelfEndedCallRef.current();
      return;
    }

    // --- Caller (male) hung up ---
    let receiverUserId: string | undefined;
    let billingResult: FinalizeBillingResult = { ok: false };
    try {
      billingResult = await finalizeSessionBilling("call", sessionId);
    } catch (e) {
      if (__DEV__) console.warn("[ActiveCall] billing finalize", e);
    }
    try {
      const row = await getCallSession(sessionId);
      receiverUserId = row?.receiver_user_id;
      await updateCallSessionStatus(sessionId, "ended");
    } catch (e) {
      if (__DEV__) {
        console.warn("[ActiveCall] end session failed", e);
      }
    }
    if (receiverUserId) {
      try {
        await restoreModelAfterRemoteCallEnd(receiverUserId);
      } catch (e) {
        if (__DEV__) {
          console.warn(
            "[ActiveCall] restore model after male hangup failed",
            e instanceof Error ? e.message : e
          );
        }
      }
    }

    queueMaleSpending(billingResult, undefined, receiverUserId ?? remoteUserId);
    finishCallerNavigation();
  }, [
    finishCallerNavigation,
    queueMaleSpending,
    queueFemaleEarnings,
    role,
    sessionId,
  ]);

  const endCallForBillingRef = useRef(endCall);
  endCallForBillingRef.current = endCall;

  const handleBillingInsufficient = useCallback(() => {
    void endCallForBillingRef.current();
  }, []);

  const { balanceInr, lowBalanceWarning } = useSessionBilling({
    enabled: isCaller && remoteJoined,
    preloadBalance: isCaller,
    sessionKind: "call",
    sessionId,
    callerUserId: isCaller ? userId ?? null : null,
    billingMode,
    elapsedSeconds: billingElapsed,
    onInsufficientBalance: handleBillingInsufficient,
  });

  const handlePressAddMoney = useCallback(() => {
    navigation.navigate("MaleWalletTopUp");
  }, [navigation]);

  const maleWalletProps = isCaller
    ? {
        walletBalanceInr: balanceInr,
        onPressAddMoney: handlePressAddMoney,
      }
    : {};

  useEffect(() => {
    if (role === "receiver") {
      setCallPhase("in_call");
    }
  }, [role, setCallPhase]);

  useModelPresenceHeartbeat(userId, role === "receiver" && Boolean(userId));

  useEffect(() => {
    if (role !== "receiver" || !userId || busyApplied) return;

    let cancelled = false;
    void (async () => {
      const previous = await setModelBusyForCall(userId);
      if (cancelled) return;
      const existing = useFemaleCallStore.getState().statusBeforeCall;
      if (previous) {
        setStatusBeforeCall(previous);
      } else if (!existing) {
        setStatusBeforeCall(
          onlineAllowsVideo
            ? MODEL_ONLINE_STATUS.VOICE_AND_VIDEO
            : MODEL_ONLINE_STATUS.VOICE_CALL
        );
      }
      setBusyApplied(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [busyApplied, onlineAllowsVideo, role, setStatusBeforeCall, userId]);

  useEffect(() => {
    setAgoraSpeakerphone(true);
    setSpeakerOn(true);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!remoteJoined) {
      setBillingElapsed(0);
      return;
    }
    setBillingElapsed(0);
    const id = setInterval(() => setBillingElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [remoteJoined, sessionId]);

  const timerLabel = useMemo(() => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, [elapsed]);

  const endCallRef = useRef(endCall);
  endCallRef.current = endCall;
  const joinedAgoraRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      setStatusLabel("Not signed in");
      return;
    }

    let cancelled = false;

    void (async () => {
      const result = await joinAgoraVoiceChannel({
        channelName,
        userId,
        enableVideo: enableVideo ?? callType === "video",
        onUserJoined: () => {
          if (!cancelled) {
            setRemoteJoined(true);
            setStatusLabel("On call");
          }
        },
        onUserOffline: () => {
          if (cancelled) return;
          setStatusLabel("Call ended");
          if (role !== "receiver") return;
          void (async () => {
            const session = await getCallSession(sessionId);
            if (!session) return;
            if (
              session.status === "ended" ||
              session.status === "cancelled" ||
              session.status === "missed"
            ) {
              await restoreFemaleAfterRemoteEndedRef.current();
              return;
            }
            // Male upgrading voice → video leaves channel briefly; keep busy.
            if (session.call_type === "video" && session.status === "connecting") {
              return;
            }
          })();
        },
      });

      if (cancelled) return;

      if (!result.ok) {
        setStatusLabel(result.message ?? "Could not join");
        if (!isAgoraNativeAvailable()) {
          Alert.alert(
            "Dev build required",
            "Voice calls need a native build with react-native-agora.",
            [{ text: "OK", onPress: () => void endCallRef.current() }]
          );
        }
        return;
      }

      joinedAgoraRef.current = true;
      if (enableVideo ?? callType === "video") {
        setLocalVideoReady(true);
      }

      try {
        await updateCallSessionStatus(sessionId, "active");
      } catch {
        // ignore
      }

      setStatusLabel("On call");
    })();

    return () => {
      cancelled = true;
      if (joinedAgoraRef.current) {
        leaveAgoraChannel();
        joinedAgoraRef.current = false;
      }
    };
  }, [callType, channelName, enableVideo, role, sessionId, userId]);

  useEffect(() => {
    if (callType !== "voice" || isVideoCall || role !== "receiver") return;

    let cancelled = false;
    const pollUpgrade = async () => {
      if (upgradingToVideoRef.current || endedHandledRef.current) return;
      const session = await getCallSession(sessionId);
      if (cancelled || !session) return;
      if (session.call_type !== "video" || session.status !== "connecting") return;

      upgradingToVideoRef.current = true;
      endedHandledRef.current = true;
      leaveAgoraChannel();
      joinedAgoraRef.current = false;

      navigation.replace("VideoCallPrep", {
        sessionId,
        channelName: session.channel_name,
        callType: "video",
        role: "receiver",
        remoteName,
        remoteAvatar: resolvedRemoteAvatar as number,
        localAvatar: resolvedLocalAvatar,
      });
    };

    const id = setInterval(() => void pollUpgrade(), 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [
    callType,
    channelName,
    isVideoCall,
    navigation,
    resolvedLocalAvatar,
    resolvedRemoteAvatar,
    remoteName,
    role,
    sessionId,
  ]);

  const queueMaleSpendingRef = useRef(queueMaleSpending);
  queueMaleSpendingRef.current = queueMaleSpending;

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (endedHandledRef.current || upgradingToVideoRef.current) return;
      if (Date.now() - mountedAtRef.current < 2000) return;

      const session = await getCallSession(sessionId);
      if (cancelled || !session) return;
      if (
        session.status !== "ended" &&
        session.status !== "cancelled" &&
        session.status !== "missed"
      ) {
        return;
      }

      leaveAgoraChannel();
      joinedAgoraRef.current = false;

      if (role === "receiver") {
        try {
          await restoreFemaleAfterRemoteEndedRef.current();
        } catch (e) {
          if (__DEV__) {
            console.warn("[ActiveCall] restore after remote end failed", e);
          }
        }
        return;
      }

      endedHandledRef.current = true;

      let billingResult: FinalizeBillingResult = { ok: false };
      try {
        billingResult = await finalizeSessionBilling("call", sessionId);
      } catch (e) {
        if (__DEV__) console.warn("[ActiveCall] finalize on remote end", e);
      }

      queueMaleSpendingRef.current(
        billingResult,
        undefined,
        session.receiver_user_id ?? remoteUserId
      );
      finishCallerNavigation();
    };
    const id = setInterval(() => void poll(), 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [finishCallerNavigation, navigation, remoteUserId, role, sessionId]);

  const handleToggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      setAgoraMuted(next);
      return next;
    });
  };

  const handleToggleSpeaker = () => {
    setSpeakerOn((prev) => {
      const next = !prev;
      setAgoraSpeakerphone(next);
      return next;
    });
  };

  const handleFlipCamera = () => {
    switchAgoraCamera();
  };

  const handleTransferVideoCall = () => {
    if (!remoteSupportsVideo) {
      Alert.alert(
        "Video unavailable",
        "This model is not available for video calls right now."
      );
      return;
    }
    setVideoModalVisible(true);
  };

  const handleConfirmVideoUpgrade = useCallback(async () => {
    if (!userId || upgradingToVideo) return;
    setVideoModalVisible(false);

    const cameraOk = await requestCameraPermission();
    if (!cameraOk) {
      Alert.alert(
        "Camera required",
        "Allow camera access to start a video call."
      );
      return;
    }

    setUpgradingToVideo(true);
    upgradingToVideoRef.current = true;
    endedHandledRef.current = true;

    leaveAgoraChannel();
    joinedAgoraRef.current = false;

    try {
      await upgradeCallSessionToVideo(sessionId);
      navigation.replace("VideoCallPrep", {
        sessionId,
        channelName,
        callType: "video",
        role: "caller",
        remoteName,
        remoteAvatar: resolvedRemoteAvatar as number,
        localAvatar: resolvedLocalAvatar,
      });
    } catch (e) {
      upgradingToVideoRef.current = false;
      endedHandledRef.current = false;
      setUpgradingToVideo(false);
      Alert.alert(
        "Video call failed",
        e instanceof Error ? e.message : "Could not start video call."
      );
    }
  }, [
    channelName,
    navigation,
    resolvedLocalAvatar,
    resolvedRemoteAvatar,
    remoteName,
    sessionId,
    upgradingToVideo,
    userId,
  ]);

  const displayStatus = remoteJoined ? "On call" : statusLabel;

  const lowBalanceBanner =
    isCaller && lowBalanceWarning ? (
      <SessionBillingBanner message="Low balance — less than 3 minutes remaining. Please add fund." />
    ) : null;

  if (isVideoCall) {
    return (
      <>
      <VideoCallInProgressLayout
        variant={variant}
        localAvatar={resolvedLocalAvatar}
        remoteAvatar={resolvedRemoteAvatar}
        remoteName={remoteName}
        timerLabel={timerLabel}
        statusLabel={displayStatus}
        remoteJoined={remoteJoined}
        localVideoReady={localVideoReady}
        muted={muted}
        speakerOn={speakerOn}
        onToggleMute={handleToggleMute}
        onToggleSpeaker={handleToggleSpeaker}
        onEndCall={() => void endCall()}
        onFlipCamera={handleFlipCamera}
        {...maleWalletProps}
      />
      {lowBalanceBanner}
      </>
    );
  }

  return (
    <>
      <CallInProgressLayout
        variant={variant}
        localAvatar={resolvedLocalAvatar}
        remoteAvatar={resolvedRemoteAvatar}
        remoteName={remoteName}
        statusLabel={displayStatus}
        isConnected={remoteJoined}
        muted={muted}
        speakerOn={speakerOn}
        onToggleMute={handleToggleMute}
        onToggleSpeaker={handleToggleSpeaker}
        onEndCall={() => void endCall()}
        remoteSupportsVideo={role === "caller" && remoteSupportsVideo}
        onTransferVideoCall={
          role === "caller" && remoteSupportsVideo
            ? handleTransferVideoCall
            : undefined
        }
        {...maleWalletProps}
      />
      {lowBalanceBanner}
      {role === "caller" ? (
        <MaleVideoCallConfirmModal
          visible={videoModalVisible}
          modelName={remoteName}
          modelAvatar={resolvedRemoteAvatar}
          pricePerMin={videoRateInrPerMin}
          onCancel={() => setVideoModalVisible(false)}
          onConfirm={() => void handleConfirmVideoUpgrade()}
        />
      ) : null}
    </>
  );
}
