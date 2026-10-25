// Records the Kavach flow on the live site with Playwright, one continuous 1920x1080 video plus a
// JSON of named marks (seconds since recording start) so clips can be cut per scene.
//   KAVACH_URL=https://kavach-flame-gamma.vercel.app node record/record.mjs
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readdirSync, renameSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..", "..");
const BASE = (process.env.KAVACH_URL ?? "https://kavach-flame-gamma.vercel.app").replace(/\/$/, "");
const RAW = path.join(here, "..", "footage", "raw");
mkdirSync(RAW, { recursive: true });

const PORTRAIT = path.join(repo, "public", "demo", "priya-1.png");
const EXHIBIT = path.join(repo, "scripts", "seed-out", "exhibit.png");

// A visible cursor: Playwright videos do not draw one. Injected on every page, moved by page.mouse.
const CURSOR = `
(() => {
  if (window.__kcursor) return;
  const c = document.createElement('div');
  c.id = '__kcursor';
  c.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:30px;z-index:2147483647;pointer-events:none;transform:translate(-4px,-2px);transition:transform .08s ease-out';
  c.innerHTML = '<svg width="22" height="30" viewBox="0 0 22 30"><path d="M2 2 L2 24 L8 18 L12 28 L16 26 L12 16 L20 16 Z" fill="#f4efe6" stroke="#121212" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const add = () => document.body && document.body.appendChild(c);
  document.body ? add() : document.addEventListener('DOMContentLoaded', add);
  window.addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
  window.addEventListener('mousedown', () => { c.style.transform = 'translate(-4px,-2px) scale(.85)'; }, true);
  window.addEventListener('mouseup', () => { c.style.transform = 'translate(-4px,-2px) scale(1)'; }, true);
  window.__kcursor = c;
})();`;

const t0 = Date.now();
const marks = {};
const mark = (name) => {
  marks[name] = (Date.now() - t0) / 1000;
  console.log(`${marks[name].toFixed(1).padStart(6)}s  ${name}`);
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function glide(page, locator, { click = false, settle = 500 } = {}) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error("no box for " + locator);
  const x = box.x + Math.min(box.width - 12, Math.max(12, box.width * 0.4));
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y, { steps: 28 });
  await pause(settle);
  if (click) {
    await page.mouse.down();
    await pause(90);
    await page.mouse.up();
  }
}

async function typeSlow(page, locator, text) {
  await glide(page, locator, { click: true, settle: 250 });
  await page.keyboard.type(text, { delay: 55 });
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    recordVideo: { dir: RAW, size: { width: 1920, height: 1080 } },
  });
  await context.addInitScript(CURSOR);
  const page = await context.newPage();
  await page.mouse.move(960, 700);

  // Home
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  mark("home");
  await pause(2500);
  await page.mouse.move(700, 520, { steps: 30 });
  await pause(800);
  await glide(page, page.getByRole("link", { name: "Raise your shield" }), { click: true, settle: 700 });
  await page.waitForURL(/\/vault/);
  await page.waitForLoadState("networkidle");
  mark("vault-open");
  await pause(1200);

  // Create a shield
  await typeSlow(page, page.locator("#name"), "Priya Sharma");
  await pause(300);
  await typeSlow(page, page.locator("#pin"), "4821");
  await pause(400);
  await glide(page, page.getByRole("button", { name: "Create shield" }), { click: true, settle: 500 });
  await page.waitForSelector("input[type=file]", { state: "attached", timeout: 30000 });
  mark("shield-created");
  await pause(1200);

  // Register a photo
  const file = page.locator("input[type=file]").first();
  await glide(page, page.locator("input[type=file]").first().locator("xpath=.."), { settle: 400 }).catch(() => {});
  await file.setInputFiles(PORTRAIT);
  mark("vault-uploading");
  await page.waitForSelector("img[src*='/api/img']", { timeout: 60000 });
  mark("vault-photo");
  await pause(2500);

  // Check
  await glide(page, page.getByRole("link", { name: /check/i }).first(), { click: true, settle: 600 });
  await page.waitForURL(/\/check/);
  await page.waitForLoadState("networkidle");
  mark("check-open");
  await pause(1200);
  const file2 = page.locator("input[type=file]").first();
  await file2.setInputFiles(EXHIBIT);
  await pause(1500);
  const select = page.locator("select").first();
  if (await select.count()) {
    await glide(page, select, { settle: 300 });
    await select.selectOption({ label: "Instagram" }).catch(() => select.selectOption("Instagram"));
  }
  await pause(400);
  await typeSlow(page, page.locator("#url"), "https://instagram.com/p/kavach-demo");
  await pause(500);
  mark("check-filled");
  await glide(page, page.getByRole("button", { name: "Check", exact: true }), { click: true, settle: 600 });
  mark("check-running");
  await page.waitForURL(/\/case\//, { timeout: 90000 });
  await page.waitForLoadState("networkidle");
  mark("case-open");
  await pause(3500);

  // Drafts: wait for Gemma
  const drafted = page.getByText(/Drafted by|Fallback text|Template text/);
  await drafted.first().waitFor({ timeout: 90000 }).catch(() => {});
  mark("drafts-ready");
  await pause(1500);
  await page.mouse.wheel(0, 420);
  await pause(1800);
  await page.mouse.wheel(0, 420);
  await pause(1800);
  const portalTab = page.getByRole("button", { name: "Cyber Crime Portal" }).first();
  if (await portalTab.count()) {
    await glide(page, portalTab, { click: true, settle: 500 });
    await pause(2200);
  }
  const bundle = page.getByRole("link", { name: "Download evidence bundle" }).first();
  if (await bundle.count()) {
    await glide(page, bundle, { settle: 600 });
    await pause(1200);
  }
  mark("end");
  await pause(1500);

  const video = page.video();
  await context.close();
  await browser.close();
  const vpath = await video.path();
  const out = path.join(RAW, "session.webm");
  renameSync(vpath, out);
  writeFileSync(path.join(here, "..", "footage", "marks.json"), JSON.stringify({ base: BASE, marks }, null, 2));
  console.log("wrote", out, "and footage/marks.json");
  console.log("raw dir:", readdirSync(RAW));
}

main().catch((e) => {
  console.error("RECORD FAILED", e);
  process.exit(1);
});
