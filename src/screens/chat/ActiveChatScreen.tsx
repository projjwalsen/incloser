import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, Alert, Image, KeyboardAvoidingView, Platform, ActivityIndicator, type ImageSourcePropType } from 'react-native';
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import type { AuthStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import { useFemaleChatStore } from "../../store/femaleChatStore";
import { colors } from "../../theme/colors";
import { useChatSession } from "../../hooks/useChatSession";
import { useChatMessages } from "../../hooks/useChatMessages";
import { ChatMessageBubble } from "../../components/chat/ChatMessageBubble";
import { VoiceMessagePreviewBar } from "../../components/chat/VoiceMessagePreviewBar";
import { CallInCallGradientAnimation } from "../../components/call/CallInCallGradientAnimation";
import { AVATARS } from "../../constants/avatars";
import { FEMALE_AVATARS } from "../../constants/avatarsFemale";
import {
  sendChatTextMessage,
  sendChatVoiceMessage,
} from "../../services/supabase/chatMessages.service";
import {
  getChatSession,
  updateChatSessionStatus,
} from "../../services/supabase/chatSessions.service";
import {
  ensureModelDiscoverableAfterCall,
  restoreModelAfterRemoteChatEnd,
  restoreModelStatusAfterCall,
  setModelBusyForCall,
  setModelOfflineAfterFemaleEndedCall,
} from "../../services/supabase/femaleCallBusy.service";
import { MODEL_ONLINE_STATUS } from "../../services/supabase/femaleOnlineStatus.service";
import { uploadChatVoiceMessage } from "../../services/supabase/chatVoiceStorage.service";
import { requestMicrophonePermission } from "../../services/callPermissions.service";
import { useModelPresenceHeartbeat } from "../../hooks/useModelPresenceHeartbeat";
import { useSessionBilling } from "../../hooks/useSessionBilling";
import { useWalletBalance } from "../../hooks/useWalletBalance";
import {
  finalizeSessionBilling,
  type FinalizeBillingResult,
} from "../../services/supabase/billing.service";
import { SessionBillingBanner } from "../../components/billing/SessionBillingBanner";
import { type ModelEarningsSummary } from "../../components/billing/ModelSessionEarningsModal";
import {
  type MaleSpendingSummary,
} from "../../components/billing/MaleSessionSpendingModal";
import { useMaleSessionStore } from "../../store/maleSessionStore";
import { usePreventScreenCapture } from "../../hooks/usePreventScreenCapture";
import { Pressable } from "../../components/HapticPressable";

type Route = RouteProp<AuthStackParamList, "ActiveChat">;
type Nav = NativeStackNavigationProp<AuthStackParamList, "ActiveChat">;

const DEFAULT_FEMALE =
  FEMALE_AVATARS[0]?.source ?? require("../../../assets/images/female_profile.png");
const DEFAULT_MALE = AVATARS[0]?.source;
const QUICK_EMOJIS = ["😊", "😂", "😍", "😘", "🔥", "❤️", "👍", "🥺", "😎", "🎉"] as const;

function formatTimer(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function ActiveChatScreen() {
  usePreventScreenCapture();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.session?.userId);
  const setChatPhase = useFemaleChatStore((s) => s.setChatPhase);
  const endChatSession = useFemaleChatStore((s) => s.endChatSession);
  const statusBeforeChat = useFemaleChatStore((s) => s.statusBeforeChat);
  const setStatusBeforeChat = useFemaleChatStore((s) => s.setStatusBeforeChat);
  const setPendingChatEarnings = useFemaleChatStore((s) => s.setPendingEarnings);
  const setPendingSpending = useMaleSessionStore((s) => s.setPendingSpending);

  const { sessionId, role, remoteName, remoteAvatar, localAvatar } = route.params;
  const isReceiver = role === "receiver";

  const { session, refresh, setSession } = useChatSession(sessionId);
  const { messages, loadMessages, appendMessage } = useChatMessages(sessionId);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [pendingVoiceUri, setPendingVoiceUri] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const { balanceInr, refresh: refreshWallet } = useWalletBalance(
    !isReceiver ? userId : null
  );
  const recordingRef = useRef<Audio.Recording | null>(null);
  const endedHandledRef = useRef(false);
  const listRef = useRef<FlatList>(null);

  const textUnlocked = session?.text_unlocked ?? false;

  const remoteAvatarSource: ImageSourcePropType =
    remoteAvatar ?? (isReceiver ? DEFAULT_MALE : DEFAULT_FEMALE);

  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(t);
  }, [messages.length, textUnlocked]);

  useEffect(() => {
    if (!textUnlocked || !session?.timer_started_at) return;
    const start = Date.parse(session.timer_started_at);
    if (!Number.isFinite(start)) return;

    const tick = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session?.timer_started_at, textUnlocked]);

  useEffect(() => {
    if (!isReceiver || !userId) return;
    setChatPhase("in_chat");
    void (async () => {
      const previous = await setModelBusyForCall(userId);
      if (previous) setStatusBeforeChat(previous);
      else if (!useFemaleChatStore.getState().statusBeforeChat) {
        setStatusBeforeChat(MODEL_ONLINE_STATUS.TEXT);
      }
    })();
  }, [isReceiver, setChatPhase, setStatusBeforeChat, userId]);

  useModelPresenceHeartbeat(userId, isReceiver && Boolean(userId));

  const buildChatEarningsSummary = useCallback(
    (result: FinalizeBillingResult): ModelEarningsSummary => ({
      sessionKind: "chat",
      remoteName,
      mode: "text",
      durationSeconds: result.durationSeconds ?? 0,
      modelMinutes: result.modelMinutes ?? 0,
      modelEarningInr: result.modelEarningInr ?? 0,
      rateInrPerMin: result.rateInrPerMin,
      sharePercent: result.sharePercent,
    }),
    [remoteName]
  );

  const queueChatEarnings = useCallback(
    (result: FinalizeBillingResult) => {
      if (!isReceiver || !result.ok) return;
      setPendingChatEarnings(buildChatEarningsSummary(result));
    },
    [buildChatEarningsSummary, isReceiver, setPendingChatEarnings]
  );

  const buildMaleChatSpendingSummary = useCallback(
    (
      result: FinalizeBillingResult,
      balanceAfterInr?: number,
      modelUserId?: string
    ): MaleSpendingSummary => ({
      sessionKind: "chat",
      remoteName,
      sessionId,
      callerUserId: userId ?? undefined,
      modelUserId,
      mode: "text",
      durationSeconds: result.durationSeconds ?? 0,
      callerChargedMinutes: result.callerChargedMinutes ?? 0,
      callerTotalDebitedInr: result.callerTotalDebitedInr ?? 0,
      rateInrPerMin: result.rateInrPerMin,
      balanceAfterInr,
    }),
    [remoteName, sessionId, userId]
  );

  const showMaleSpendingThen = useCallback(
    (
      result: FinalizeBillingResult,
      balanceAfterInr: number | undefined,
      modelUserId: string | undefined,
      then: () => void
    ) => {
      if (isReceiver || !result.ok) {
        then();
        return;
      }
      if ((result.callerChargedMinutes ?? 0) === 0) {
        then();
        return;
      }
      setPendingSpending(
        buildMaleChatSpendingSummary(result, balanceAfterInr, modelUserId)
      );
      then();
    },
    [buildMaleChatSpendingSummary, isReceiver, setPendingSpending]
  );

  const restoreFemaleAfterRemoteEnded = useCallback(async () => {
    if (!isReceiver || !userId || endedHandledRef.current) return;

    let billingResult: FinalizeBillingResult = { ok: false };
    try {
      billingResult = await finalizeSessionBilling("chat", sessionId);
    } catch (e) {
      if (__DEV__) console.warn("[ActiveChat] finalize on remote end", e);
    }

    // Park earnings — the waiting screen will pick this up and show the popup.
    queueChatEarnings(billingResult);

    const restoreTo =
      statusBeforeChat ??
      useFemaleChatStore.getState().statusBeforeChat ??
      MODEL_ONLINE_STATUS.TEXT;
    try {
      await restoreModelStatusAfterCall(userId, restoreTo);
      await ensureModelDiscoverableAfterCall(userId, restoreTo);
    } catch (e) {
      if (__DEV__) console.warn("[ActiveChat] restore failed", e);
    }
    endedHandledRef.current = true;
    setStatusBeforeChat(null);
    setChatPhase("online");
    navigation.reset({
      index: 1,
      routes: [{ name: "FemaleHome" }, { name: "FemaleChatActive" }],
    });
  }, [
    isReceiver,
    navigation,
    queueChatEarnings,
    sessionId,
    setChatPhase,
    setStatusBeforeChat,
    statusBeforeChat,
    userId,
  ]);

  const finishFemaleSelfEnded = useCallback(async () => {
    if (!isReceiver || !userId) return;
    await setModelOfflineAfterFemaleEndedCall(userId);
    endChatSession();
    navigation.reset({ index: 0, routes: [{ name: "FemaleHome" }] });
  }, [endChatSession, isReceiver, navigation, userId]);

  const finishFemaleSelfEndedRef = useRef(finishFemaleSelfEnded);
  finishFemaleSelfEndedRef.current = finishFemaleSelfEnded;

  const finishCallerNavigation = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.reset({ index: 0, routes: [{ name: "MaleHome" }] });
  }, [navigation]);

  const endChat = useCallback(async () => {
    let receiverUserId = session?.receiver_user_id;
    if (!receiverUserId) {
      const row = await getChatSession(sessionId);
      receiverUserId = row?.receiver_user_id;
    }

    endedHandledRef.current = true;

    let billingResult: FinalizeBillingResult = { ok: false };
    if (!isReceiver) {
      try {
        billingResult = await finalizeSessionBilling("chat", sessionId);
        await refreshWallet();
      } catch (e) {
        if (__DEV__) console.warn("[ActiveChat] billing finalize", e);
      }
    }

    try {
      await updateChatSessionStatus(sessionId, "ended");
    } catch (e) {
      if (__DEV__) {
        console.warn(
          "[ActiveChat] end session failed",
          e instanceof Error ? e.message : e
        );
      }
    }

    if (isReceiver) {
      let femBilling: FinalizeBillingResult = { ok: false };
      try {
        femBilling = await finalizeSessionBilling("chat", sessionId);
      } catch (e) {
        if (__DEV__) console.warn("[ActiveChat] billing finalize", e);
      }
      queueChatEarnings(femBilling);
      void finishFemaleSelfEndedRef.current();
      return;
    }

    if (receiverUserId) {
      try {
        await restoreModelAfterRemoteChatEnd(receiverUserId);
      } catch (e) {
        if (__DEV__) {
          console.warn(
            "[ActiveChat] restore model after male hangup failed",
            e instanceof Error ? e.message : e
          );
        }
      }
    }

    showMaleSpendingThen(
      billingResult,
      balanceInr,
      receiverUserId,
      finishCallerNavigation
    );
  }, [
    balanceInr,
    finishCallerNavigation,
    isReceiver,
    queueChatEarnings,
    refreshWallet,
    session?.receiver_user_id,
    sessionId,
    showMaleSpendingThen,
  ]);

  const endChatForBillingRef = useRef(endChat);
  endChatForBillingRef.current = endChat;

  const handleBillingInsufficient = useCallback(() => {
    void endChatForBillingRef.current();
  }, []);

  const { lowBalanceWarning } = useSessionBilling({
    enabled: !isReceiver && textUnlocked,
    sessionKind: "chat",
    sessionId,
    callerUserId: !isReceiver ? userId ?? null : null,
    billingMode: "text",
    elapsedSeconds: elapsed,
    onInsufficientBalance: handleBillingInsufficient,
  });

  const showMaleSpendingThenRef = useRef(showMaleSpendingThen);
  showMaleSpendingThenRef.current = showMaleSpendingThen;
  const finishCallerNavigationRef = useRef(finishCallerNavigation);
  finishCallerNavigationRef.current = finishCallerNavigation;

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (endedHandledRef.current) return;
      const row = await getChatSession(sessionId);
      if (cancelled || !row) return;
      if (
        row.status !== "ended" &&
        row.status !== "cancelled" &&
        row.status !== "missed"
      ) {
        setSession(row);
        return;
      }
      if (isReceiver) {
        if (!endedHandledRef.current) {
          await restoreFemaleAfterRemoteEnded();
        }
      } else {
        let billingResult: FinalizeBillingResult = { ok: false };
        try {
          billingResult = await finalizeSessionBilling("chat", sessionId);
        } catch (e) {
          if (__DEV__) console.warn("[ActiveChat] finalize on remote end", e);
        }
        endedHandledRef.current = true;
        showMaleSpendingThenRef.current(
          billingResult,
          balanceInr,
          row.receiver_user_id,
          () => finishCallerNavigationRef.current()
        );
      }
    };
    const id = setInterval(() => void poll(), 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [
    balanceInr,
    isReceiver,
    navigation,
    restoreFemaleAfterRemoteEnded,
    sessionId,
    setSession,
  ]);

  const canSendText = textUnlocked;
  const canSendVoice = isReceiver && !textUnlocked;

  const handleSendText = async () => {
    if (!userId || !canSendText || sending) return;
    setSending(true);
    try {
      const msg = await sendChatTextMessage({
        sessionId,
        senderUserId: userId,
        body: draft,
      });
      appendMessage(msg);
      setDraft("");
      setEmojiOpen(false);
      await refresh();
      await loadMessages();
    } catch (e) {
      Alert.alert(
        "Send failed",
        e instanceof Error ? e.message : "Could not send message."
      );
    } finally {
      setSending(false);
    }
  };

  const startVoiceRecording = async () => {
    if (!canSendVoice || recording) return;
    const ok = await requestMicrophonePermission();
    if (!ok) {
      Alert.alert("Microphone required", "Allow microphone to send a voice message.");
      return;
    }
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
      setRecording(true);
    } catch (e) {
      Alert.alert(
        "Recording failed",
        e instanceof Error ? e.message : "Could not start recording."
      );
    }
  };

  const finishRecordingForPreview = async () => {
    const rec = recordingRef.current;
    if (!rec) {
      setRecording(false);
      return;
    }

    setRecording(false);
    recordingRef.current = null;

    try {
      const status = await rec.getStatusAsync();
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      const durationMs = status.isRecording ? status.durationMillis : 0;
      if (!uri) throw new Error("No recording URI.");
      if (durationMs < 400) {
        throw new Error("Hold the mic a little longer before previewing.");
      }
      setPendingVoiceUri(uri);
    } catch (e) {
      Alert.alert(
        "Recording failed",
        e instanceof Error ? e.message : "Could not save recording."
      );
    }
  };

  const discardPendingVoice = () => {
    setPendingVoiceUri(null);
  };

  const sendPendingVoice = async () => {
    if (!pendingVoiceUri || !userId || !session) return;

    const uri = pendingVoiceUri;
    setSending(true);

    try {
      const audioUrl = await uploadChatVoiceMessage(uri, sessionId, userId);
      const msg = await sendChatVoiceMessage({
        sessionId,
        senderUserId: userId,
        audioUrl,
        session,
        isReceiver: true,
      });
      setPendingVoiceUri(null);
      appendMessage(msg);
      const updated = await refresh();
      if (updated) setSession(updated);
      await loadMessages();
    } catch (e) {
      Alert.alert(
        "Voice message failed",
        e instanceof Error ? e.message : "Could not send voice message."
      );
    } finally {
      setSending(false);
    }
  };

  const handleVoicePress = () => {
    if (sending || pendingVoiceUri) return;
    if (recording) {
      void finishRecordingForPreview();
    } else {
      void startVoiceRecording();
    }
  };

  const hintText = useMemo(() => {
    if (!textUnlocked && isReceiver) {
      return "Send a voice message to start the chat timer";
    }
    if (!textUnlocked && !isReceiver) {
      return "Waiting for her voice message…";
    }
    return "Type a message";
  }, [isReceiver, textUnlocked]);

  const viewerRole = isReceiver ? "female" : "male";

  const renderItem = useCallback(
    ({ item }: { item: (typeof messages)[0] }) => (
      <ChatMessageBubble
        message={item}
        isMine={item.sender_user_id === userId}
        viewerRole={viewerRole}
        remoteAvatar={remoteAvatarSource}
      />
    ),
    [remoteAvatarSource, userId, viewerRole]
  );

  const handlePressAddMoney = () => {
    navigation.navigate("MaleWalletTopUp");
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />
      <CallInCallGradientAnimation variant={isReceiver ? "female" : "male"} />
      {!isReceiver && lowBalanceWarning ? (
        <SessionBillingBanner message="Low balance — less than 3 minutes remaining. Please add fund." />
      ) : null}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => void endChat()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text.white} />
        </Pressable>
        <View style={styles.headerProfile}>
          <Image
            source={remoteAvatarSource}
            style={styles.headerAvatar}
            resizeMode="cover"
          />
          <View style={styles.headerTextCol}>
            <Text style={styles.headerName} numberOfLines={1}>
              {remoteName}
            </Text>
            {textUnlocked ? (
              <Text style={styles.headerTimer}>{formatTimer(elapsed)}</Text>
            ) : (
              <Text style={styles.headerSub}>Chat</Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          {!isReceiver ? (
            <View style={styles.walletChip}>
              <Text style={styles.walletText}>₹ {balanceInr.toFixed(2)}</Text>
              <Pressable onPress={handlePressAddMoney} style={styles.addButton}>
                <Text style={styles.addIcon}>+</Text>
              </Pressable>
            </View>
          ) : null}
          <Pressable onPress={() => void endChat()} style={styles.headerBtn}>
            <Ionicons name="close" size={24} color={colors.text.white} />
          </Pressable>
        </View>
      </View>

      <View style={styles.chatPanel}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.messageListScroll}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <Text style={styles.emptyHint}>{hintText}</Text>
          }
        />
      </View>

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {pendingVoiceUri ? (
          <VoiceMessagePreviewBar
            uri={pendingVoiceUri}
            sending={sending}
            onDiscard={discardPendingVoice}
            onSend={() => void sendPendingVoice()}
          />
        ) : (
          <>
            <Text style={styles.composerHint}>
              {canSendVoice
                ? recording
                  ? "Tap stop, then preview before sending"
                  : "Tap mic to record voice message"
                : hintText}
            </Text>
            <View style={styles.composerRow}>
              {canSendVoice ? (
                <Pressable
                  style={[styles.voiceBtn, recording && styles.voiceBtnActive]}
                  onPress={() => handleVoicePress()}
                  disabled={sending}
                >
                  <Ionicons
                    name={recording ? "stop-circle" : "mic"}
                    size={24}
                    color={colors.text.white}
                  />
                </Pressable>
              ) : null}
              <Pressable
                style={[styles.emojiBtn, !canSendText && styles.sendBtnDisabled]}
                onPress={() => setEmojiOpen((prev) => !prev)}
                disabled={!canSendText || sending}
              >
                <Ionicons
                  name={emojiOpen ? "happy" : "happy-outline"}
                  size={22}
                  color={colors.text.white}
                />
              </Pressable>

              <TextInput
                style={[styles.input, !canSendText && styles.inputDisabled]}
                placeholder={hintText}
                placeholderTextColor="rgba(255,255,255,0.55)"
                value={draft}
                onChangeText={setDraft}
                editable={canSendText && !sending}
                multiline
              />

              <Pressable
                style={[
                  styles.sendBtn,
                  (!canSendText || !draft.trim()) && styles.sendBtnDisabled,
                ]}
                onPress={() => void handleSendText()}
                disabled={!canSendText || !draft.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator color={colors.text.white} size="small" />
                ) : (
                  <Ionicons name="send" size={20} color={colors.text.white} />
                )}
              </Pressable>
            </View>
            {emojiOpen && canSendText ? (
              <View style={styles.emojiStrip}>
                {QUICK_EMOJIS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    style={styles.emojiChip}
                    onPress={() => setDraft((prev) => `${prev}${emoji}`)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.callCommunication.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "transparent",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  walletChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 4,
    gap: 6,
  },
  walletText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.5,
    color: colors.text.white,
  },
  addButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text.white,
    justifyContent: "center",
    alignItems: "center",
  },
  addIcon: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    lineHeight: 18,
    color: "#3B82F6",
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 8,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.callCommunication.primary,
    backgroundColor: colors.callCommunication.statusCard,
  },
  headerTextCol: {
    flex: 1,
    justifyContent: "center",
  },
  headerName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: colors.text.white,
  },
  headerTimer: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: colors.callCommunication.onlineStatus,
    marginTop: 2,
    textAlign: "left",
  },
  headerSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
    textAlign: "left",
  },
  chatPanel: {
    flex: 1,
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  messageListScroll: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    flexGrow: 1,
  },
  emptyHint: {
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.9)",
    marginTop: 40,
    paddingHorizontal: 16,
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  composerHint: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.92)",
    marginBottom: 10,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.callCommunication.statusCard,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: colors.text.white,
  },
  inputDisabled: {
    opacity: 0.45,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.callCommunication.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },
  voiceBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.femaleHome.logoBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceBtnActive: {
    backgroundColor: colors.callCommunication.primary,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiStrip: {
    marginTop: 8,
    marginBottom: 2,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "rgba(9,11,16,0.45)",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emojiChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  emojiText: {
    fontSize: 18,
  },
});
