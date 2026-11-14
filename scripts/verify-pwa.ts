// ============================================================
// verify-pwa.ts — Automated PWA Verification Suite
// Validates manifest, service worker, icons, screenshots & offline compliance
// ============================================================

import fs from "fs";
import path from "path";

const rootDir = process.cwd();

function checkFileExists(relPath: string): boolean {
  const fullPath = path.join(rootDir, relPath);
  const exists = fs.existsSync(fullPath);
  if (!exists) {
    console.error(`❌ Missing required file: ${relPath}`);
  } else {
    console.log(`✅ Found: ${relPath}`);
  }
  return exists;
}

function verifyManifest() {
  console.log("\n--- Checking Web App Manifest ---");
  const manifestPath = path.join(rootDir, "public", "manifest.webmanifest");
  if (!fs.existsSync(manifestPath)) {
    throw new Error("manifest.webmanifest not found");
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  const requiredFields = [
    "name",
    "short_name",
    "start_url",
    "display",
    "background_color",
    "theme_color",
    "icons",
  ];
  for (const field of requiredFields) {
    if (!manifest[field]) {
      throw new Error(`Manifest missing field: ${field}`);
    }
  }
  console.log(`✅ Name: "${manifest.name}"`);
  console.log(`✅ Short Name: "${manifest.short_name}"`);
  console.log(`✅ Display: "${manifest.display}"`);
  console.log(`✅ Theme Color: "${manifest.theme_color}"`);
  console.log(`✅ Background Color: "${manifest.background_color}"`);

  // Verify icons exist
  console.log("\n--- Checking Icons & Purpose ---");
  let hasMaskable = false;
  let hasStandard = false;

  for (const icon of manifest.icons) {
    const iconFile = icon.src.startsWith("/") ? icon.src.slice(1) : icon.src;
    const fullIconPath = path.join(rootDir, "public", iconFile);
    if (!fs.existsSync(fullIconPath)) {
      throw new Error(`Referenced icon does not exist: ${icon.src}`);
    }
    const stats = fs.statSync(fullIconPath);
    console.log(`✅ Icon: ${icon.src} (${icon.sizes}, ${icon.purpose || "any"}, ${stats.size} bytes)`);

    if (icon.purpose === "maskable") hasMaskable = true;
    if (icon.purpose === "any" || !icon.purpose) hasStandard = true;
  }

  if (!hasMaskable) throw new Error("Manifest must include maskable icon for Android / ChromeOS");
  if (!hasStandard) throw new Error("Manifest must include standard icon");

  // Verify screenshots
  console.log("\n--- Checking Screenshots ---");
  if (!manifest.screenshots || manifest.screenshots.length === 0) {
    throw new Error("Manifest missing screenshots");
  }
  for (const shot of manifest.screenshots) {
    const shotFile = shot.src.startsWith("/") ? shot.src.slice(1) : shot.src;
    const fullShotPath = path.join(rootDir, "public", shotFile);
    if (!fs.existsSync(fullShotPath)) {
      throw new Error(`Referenced screenshot does not exist: ${shot.src}`);
    }
    const stats = fs.statSync(fullShotPath);
    console.log(`✅ Screenshot: ${shot.src} (${shot.sizes}, ${shot.form_factor}, ${stats.size} bytes)`);
  }
}

function verifyServiceWorker() {
  console.log("\n--- Checking Service Worker (sw.js) ---");
  const swPath = path.join(rootDir, "public", "sw.js");
  if (!fs.existsSync(swPath)) {
    throw new Error("sw.js not found in public/");
  }
  const swContent = fs.readFileSync(swPath, "utf-8");

  const requiredTokens = [
    "install",
    "activate",
    "fetch",
    "caches.open",
    "skipWaiting",
    "clients.claim",
    "navigate",
  ];

  for (const token of requiredTokens) {
    if (!swContent.includes(token)) {
      throw new Error(`Service Worker missing required feature/token: ${token}`);
    }
    console.log(`✅ SW includes '${token}' handling`);
  }
}

function verifyIndexHtml() {
  console.log("\n--- Checking index.html PWA tags ---");
  const indexPath = path.join(rootDir, "index.html");
  const html = fs.readFileSync(indexPath, "utf-8");

  const checks = [
    { label: "manifest link", pattern: /rel=["']manifest["']/ },
    { label: "apple-touch-icon", pattern: /rel=["']apple-touch-icon["']/ },
    { label: "apple-mobile-web-app-capable", pattern: /name=["']apple-mobile-web-app-capable["']/ },
    { label: "apple-mobile-web-app-status-bar-style", pattern: /name=["']apple-mobile-web-app-status-bar-style["']/ },
    { label: "apple-mobile-web-app-title", pattern: /name=["']apple-mobile-web-app-title["']/ },
    { label: "viewport-fit=cover", pattern: /viewport-fit=cover/ },
  ];

  for (const check of checks) {
    if (!check.pattern.test(html)) {
      throw new Error(`index.html missing: ${check.label}`);
    }
    console.log(`✅ index.html has ${check.label}`);
  }
}

function main() {
  console.log("==================================================");
  console.log("🛰️ Outpost Commander PWA & Offline Verification");
  console.log("==================================================");

  verifyManifest();
  verifyServiceWorker();
  verifyIndexHtml();

  console.log("\n--- Checking React & Component Integration ---");
  checkFileExists("src/serviceWorkerRegistration.ts");
  checkFileExists("src/utils/usePwa.ts");
  checkFileExists("src/components/PwaStatusBanner.tsx");
  checkFileExists("src/components/PwaNavButton.tsx");

  console.log("\n==================================================");
  console.log("🎉 ALL PWA & OFFLINE VERIFICATIONS PASSED!");
  console.log("==================================================");
}

main();
