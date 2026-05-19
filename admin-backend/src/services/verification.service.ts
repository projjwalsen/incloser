import type { PostgrestError } from "@supabase/supabase-js";
import { resolveAudioPlaybackUrl } from "../lib/audioPlaybackUrl.js";
import { resolveFemaleAvatarImageUrl } from "../lib/femaleAvatarImageUrl.js";
import { isMissingRelationError, pgErrorText } from "../lib/supabase-errors.js";
import { getSupabaseAdminClient } from "../lib/supabase.js";
import {
  syncModelUserAccountFromAudioVerificationId,
  syncModelUserAccountFromFemaleProfileId,
} from "./model-account-sync.service.js";

type ProfileQueueItem = {
  id: string;
  modelId: string;
  nickname: string;
  avatarImageUrl: string | null;
  city: string | null;
  submittedAt: string;
  flags: string[];
  verificationStatus: "pending" | "approved" | "rejected" | "review";
};

type AudioQueueItem = {
  id: string;
  modelId: string;
  nickname: string;
  avatarImageUrl: string | null;
  submittedAt: string;
  duration: string;
  status: "pending" | "approved" | "rejected" | "review";
  note: string;
  audioUrl: string | null;
};

type ProfileRow = {
  id: string;
  nickname: string | null;
  avatar_id: string | null;
  city: string | null;
  verification_status: "pending" | "approved" | "rejected" | "review" | null;
  created_at: string | null;
  updated_at: string | null;
};

type AudioRow = {
  id: string;
  model_id: string;
  status: "pending" | "approved" | "rejected" | "review" | null;
  note: string | null;
  submitted_at: string | null;
  updated_at: string | null;
  created_at: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
};

function formatSubmittedAt(iso: string | null): string {
  const value = iso ?? new Date().toISOString();
  return new Date(value).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function durationLabel(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function featureUnavailable(entity: string, error: PostgrestError | null): Error {
  return new Error(`${entity} is not available in this database (${pgErrorText(error)}).`);
}

export const verificationService = {
  async profileQueue(): Promise<ProfileQueueItem[]> {
    const supabase = getSupabaseAdminClient();
    // DB enum `verification_status` is pending | approved | rejected (no "review" — see supabase/schema.sql).
    const { data, error } = await supabase
      .from("female_profiles")
      .select("id,nickname,avatar_id,city,verification_status,created_at,updated_at")
      .eq("verification_status", "pending")
      .order("updated_at", { ascending: false, nullsFirst: false });
    if (error) {
      if (isMissingRelationError(error)) {
        console.warn("[verification] profileQueue: female_profiles missing:", pgErrorText(error));
        return [];
      }
      throw new Error(`Profile verification queue query failed: ${pgErrorText(error)}`);
    }
    return ((data ?? []) as ProfileRow[]).map((row) => ({
      id: `pv_${row.id}`,
      modelId: row.id,
      nickname: row.nickname ?? "Unknown",
      avatarImageUrl: resolveFemaleAvatarImageUrl(row.avatar_id),
      city: row.city,
      submittedAt: formatSubmittedAt(row.updated_at ?? row.created_at),
      flags: [],
      verificationStatus: row.verification_status === "review" ? "review" : "pending",
    }));
  },

  async approveProfile(modelId: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("female_profiles").update({ verification_status: "approved" }).eq("id", modelId);
    if (error) throw new Error(`Profile approve failed: ${error.message}`);
    await syncModelUserAccountFromFemaleProfileId(modelId);
  },

  async rejectProfile(modelId: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("female_profiles").update({ verification_status: "rejected" }).eq("id", modelId);
    if (error) throw new Error(`Profile reject failed: ${error.message}`);
    await syncModelUserAccountFromFemaleProfileId(modelId);
  },

  async audioQueue(): Promise<AudioQueueItem[]> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("audio_verifications")
      .select("id,model_id,status,note,submitted_at,updated_at,created_at,audio_url,duration_seconds")
      .eq("status", "pending")
      .order("submitted_at", { ascending: false, nullsFirst: false });
    if (error) {
      if (isMissingRelationError(error)) {
        console.warn("[verification] audioQueue: audio_verifications not deployed:", pgErrorText(error));
        return [];
      }
      throw new Error(`Audio verification queue query failed: ${pgErrorText(error)}`);
    }

    const modelIds = Array.from(new Set(((data ?? []) as AudioRow[]).map((row) => row.model_id).filter(Boolean)));
    type ProfileLite = {
      id: string;
      nickname: string;
      avatarImageUrl: string | null;
      audioVerificationUrl: string | null;
    };
    let profileByModelId = new Map<string, ProfileLite>();
    if (modelIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("female_profiles")
        .select("id,nickname,avatar_id,audio_verification_url")
        .in("id", modelIds);
      if (profileError) throw new Error(`Audio queue profile lookup failed: ${profileError.message}`);
      profileByModelId = new Map(
        (profiles ?? []).map((p) => {
          const r = p as {
            id: string;
            nickname?: string | null;
            avatar_id?: string | null;
            audio_verification_url?: string | null;
          };
          const id = String(r.id);
          return [
            id,
            {
              id,
              nickname: r.nickname ?? "Unknown",
              avatarImageUrl: resolveFemaleAvatarImageUrl(r.avatar_id),
              audioVerificationUrl: r.audio_verification_url ?? null,
            },
          ];
        }),
      );
    }

    return ((data ?? []) as AudioRow[]).map((row) => {
      const prof = profileByModelId.get(row.model_id);
      const rawUrl = row.audio_url?.trim() || prof?.audioVerificationUrl?.trim() || null;
      return {
        id: row.id,
        modelId: row.model_id,
        nickname: prof?.nickname ?? "Unknown",
        avatarImageUrl: prof?.avatarImageUrl ?? null,
        submittedAt: formatSubmittedAt(row.submitted_at ?? row.updated_at ?? row.created_at),
        duration: durationLabel(row.duration_seconds),
        status: row.status === "review" ? "review" : "pending",
        note: row.note ?? "",
        audioUrl: resolveAudioPlaybackUrl(supabase, rawUrl),
      };
    });
  },

  async approveAudio(id: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("audio_verifications").update({ status: "approved" }).eq("id", id);
    if (error) {
      if (isMissingRelationError(error)) throw featureUnavailable("Audio verification", error);
      throw new Error(`Audio approve failed: ${error.message}`);
    }
    await syncModelUserAccountFromAudioVerificationId(id);
  },

  async rejectAudio(id: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("audio_verifications").update({ status: "rejected" }).eq("id", id);
    if (error) {
      if (isMissingRelationError(error)) throw featureUnavailable("Audio verification", error);
      throw new Error(`Audio reject failed: ${error.message}`);
    }
    await syncModelUserAccountFromAudioVerificationId(id);
  },

  async resubmitAudio(id: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("audio_verifications").update({ status: "pending" }).eq("id", id);
    if (error) {
      if (isMissingRelationError(error)) throw featureUnavailable("Audio verification", error);
      throw new Error(`Audio resubmit failed: ${error.message}`);
    }
    await syncModelUserAccountFromAudioVerificationId(id);
  },
};
