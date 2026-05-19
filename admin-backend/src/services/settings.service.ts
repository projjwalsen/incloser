import type { AppSettings } from "@incloser/shared-types";

const defaults: AppSettings = {
  tokenPricingInr: 1,
  defaultCallPricingTokens: 20,
  commissionPercentage: 20,
  minimumWithdrawalAmount: 500,
  languageMasterList: ["Hindi", "English", "Bengali"],
  featureToggles: {
    newDashboard: true,
    maintenanceMode: false,
    walletTopUps: true,
    modelSelfServe: true,
  },
  supportContactInfo: "support@incloser.app\n+91 80000 00000",
};

let state: AppSettings = structuredClone(defaults);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export const settingsService = {
  get(): AppSettings {
    return structuredClone(state);
  },

  /** Shallow merge for top-level keys; `featureToggles` is deep-merged when provided as an object. */
  patch(partial: Record<string, unknown>): AppSettings {
    const next: AppSettings = { ...state };
    for (const [key, value] of Object.entries(partial)) {
      if (key === "featureToggles" && isPlainObject(value)) {
        const merged = { ...next.featureToggles };
        for (const [tk, tv] of Object.entries(value)) {
          if (typeof tv === "boolean") merged[tk] = tv;
        }
        next.featureToggles = merged;
        continue;
      }
      if (key === "languageMasterList" && Array.isArray(value) && value.every((x) => typeof x === "string")) {
        next.languageMasterList = value as string[];
        continue;
      }
      if (key in next && key !== "featureToggles") {
        (next as Record<string, unknown>)[key] = value;
      }
    }
    state = next;
    return structuredClone(state);
  },
};
