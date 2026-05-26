#!/usr/bin/env node
const { execSync } = require("child_process");

function getLanIp() {
  try {
    const ip = execSync("ipconfig getifaddr en0 2>/dev/null", { encoding: "utf8" }).trim();
    if (ip) return ip;
  } catch {
    // ignore
  }
  try {
    const ip = execSync("ipconfig getifaddr en1 2>/dev/null", { encoding: "utf8" }).trim();
    if (ip) return ip;
  } catch {
    // ignore
  }
  return null;
}

const ip = getLanIp();
console.log("\n══════════════════════════════════════════════════════════");
console.log("  Wi‑Fi device: Metro must use your Mac IP (not localhost)");
console.log("══════════════════════════════════════════════════════════");
if (ip) {
  console.log(`\n  1. Phone on SAME Wi‑Fi as this Mac`);
  console.log(`  2. Shake phone → Dev menu → "Change bundle location"`);
  console.log(`     Set to:  ${ip}:8081`);
  console.log(`  3. Reload the app\n`);
  console.log(`  Test in phone browser: http://${ip}:8081/status`);
} else {
  console.log("\n  Could not detect LAN IP. Run: ipconfig getifaddr en0");
  console.log('  Then set debug server to: YOUR_IP:8081\n');
}
console.log("  USB device: use npm run start:usb (adb reverse) instead.\n");
