#!/usr/bin/env node
// 用法：node bin/cli.js <網址> [--json]
import { check, VERSION } from "../src/checker.js";

const args = process.argv.slice(2);
const json = args.includes("--json");
const urls = args.filter(a => !a.startsWith("--"));

if (!urls.length || args.includes("--help")) {
  console.log(`AI 自動化潛力檢測 v${VERSION}

用法：
  npx ai-automation-checker <網址> [<網址> ...] [--json]

範例：
  npx ai-automation-checker example.com.tw
  npx ai-automation-checker https://example.com --json`);
  process.exit(urls.length ? 0 : 1);
}

const bar = n => "█".repeat(Math.round(n / 10)) + "░".repeat(10 - Math.round(n / 10));

for (const u of urls) {
  let r;
  try { r = await check(u); } catch (e) { r = { ok: false, url: u, error: e.message }; }
  if (json) { console.log(JSON.stringify(r, null, 2)); continue; }
  console.log(`\n${r.url}`);
  if (!r.ok) { console.log(`  無法檢測：${r.error}`); process.exitCode = 1; continue; }
  if (r.title) console.log(`  ${r.title}`);
  console.log(`  網站系統：${r.cms}`);
  console.log(`  AI 自動化潛力：${bar(r.score)} ${r.score} 分（${r.level}）\n`);
  if (!r.signals.length) console.log("  首頁沒有看到明顯的重複性流程，建議從內部作業（報表、文件、客服）盤點起。");
  r.signals.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.label} → ${s.flow}`);
    s.ideas.forEach(t => console.log(`     - ${t}`));
    console.log(`     延伸閱讀：${s.readTitle} ${s.read}`);
  });
  console.log(`\n  AI 導入完整說明：${r.more.guide}`);
}
