#!/usr/bin/env bash
# Point the React Native debug app at Metro on your Mac (Wi‑Fi, no USB reverse).
set -euo pipefail

PKG="com.projjwal09.incloser"
PREFS="com.facebook.react.devsupport_preferences"

IP="${1:-$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)}"
if [[ -z "$IP" ]]; then
  echo "Usage: $0 [LAN_IP]"
  echo "Could not detect IP. Pass your Mac Wi‑Fi IP, e.g. $0 192.168.1.149"
  exit 1
fi

HOST="${IP}:8081"

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Install Android platform-tools."
  exit 1
fi

DEVICES=$(adb devices | grep -w device | wc -l | tr -d " ")
if [[ "$DEVICES" == "0" ]]; then
  echo "No adb device. Connect USB or Wireless debugging, then retry."
  exit 1
fi

XML="<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
    <string name=\"debug_http_host\">${HOST}</string>
</map>"

adb shell "run-as ${PKG} mkdir -p shared_prefs" 2>/dev/null || true
printf '%s' "$XML" | adb shell "run-as ${PKG} sh -c 'cat > shared_prefs/${PREFS}.xml'"

echo "Set debug_http_host to ${HOST} on device."
echo "Force-stop and reopen the app, or tap RELOAD."
