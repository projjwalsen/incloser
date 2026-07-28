import { useEffect } from "react";
import * as ScreenCapture from "expo-screen-capture";

/**
 * Blocks screenshots and screen recording while mounted (Android FLAG_SECURE;
 * iOS best-effort via expo-screen-capture).
 */
export function usePreventScreenCapture(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    void ScreenCapture.preventScreenCaptureAsync().catch((error) => {
      if (__DEV__) {
        console.warn("[usePreventScreenCapture] prevent failed", error);
      }
    });

    return () => {
      void ScreenCapture.allowScreenCaptureAsync().catch((error) => {
        if (__DEV__) {
          console.warn("[usePreventScreenCapture] allow failed", error);
        }
      });
    };
  }, [enabled]);
}
