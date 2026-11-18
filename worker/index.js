// Cloudflare Workers 網頁版：GET / 表單、GET /?url= 結果頁、GET /api/check?url= JSON
import { check, VERSION } from "../src/checker.js";

const esc = t => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function page(q, r) {
  let body = "";
  if (r && !r.ok) body = `<div class="card err">無法檢測：${esc(r.error)}</div>`;
  if (r && r.ok) {
    const items = r.signals.map((s, i) => `<li><h3><span>${String(i + 1).padStart(2, "0")}</span>${esc(s.label)}<small>${esc(s.flow)}</small></h3>
<ul>${s.ideas.map(t => `<li>${esc(t)}</li>`).join("")}</ul><a href="${esc(s.read)}" target="_blank" rel="noopener">延伸閱讀：${esc(s.readTitle)}</a></li>`).join("");
    body = `<div class="card"><p class="u">${esc(r.url)}</p>${r.title ? `<p class="t">${esc(r.title)}</p>` : ""}
<div class="score"><b>${r.score}</b><span>分・潛力${esc(r.level)}</span><i style="--w:${r.score}%"></i></div>
<p class="m">網站系統：${esc(r.cms)}・找到 ${r.signals.length} 個可以自動化的流程</p></div>
${r.signals.length ? `<ol class="list">${items}</ol>` : `<div class="card">首頁沒有看到明顯的重複性流程，建議從內部作業（報表、文件、客服）盤點起。</div>`}
<div class="card cta"><p>想知道哪一段最值得先做？</p><a class="btn" href="${esc(r.more.consult)}" target="_blank" rel="noopener">預約 AI 導入諮詢</a>
<a href="${esc(r.more.guide)}" target="_blank" rel="noopener">看 AI 導入懶人包</a></div>`;
  }
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI 自動化潛力檢測｜輸入官網，找出可以自動化的流程</title>
<meta name="description" content="輸入公司官網網址，自動找出詢價表單、訂單、預約、LINE 客服、徵才等可以用 AI 自動化的流程，並給出具體做法。開源工具，免安裝。">
<style>
:root{--ink:#1f2328;--mute:#6b7280;--line:#e5e1da;--bg:#f7f5f1;--pri:#2f5d50;--card:#fff}
@media (prefers-color-scheme:dark){:root{--ink:#e8e6e1;--mute:#a1a1aa;--line:#33363b;--bg:#16181b;--pri:#7fb8a6;--card:#1e2125}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.75 "Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:40px 16px 60px}h1{font:600 30px/1.4 "Noto Serif TC","PMingLiU",serif;margin:0 0 6px}
.sub{color:var(--mute);margin:0 0 24px}form{display:flex;gap:8px;margin-bottom:24px}
input{flex:1;min-width:0;padding:12px 14px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--ink);font-size:16px}
button,.btn{padding:12px 20px;border:0;border-radius:6px;background:var(--pri);color:#fff;font-size:16px;cursor:pointer;text-decoration:none;display:inline-block}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:20px;margin-bottom:16px}.err{color:#b4472b}
.u{margin:0;color:var(--mute);font-size:14px;word-break:break-all}.t{margin:2px 0 12px;font-weight:600}.m{margin:8px 0 0;color:var(--mute);font-size:14px}
.score{display:flex;align-items:baseline;gap:8px;position:relative;padding-bottom:12px}.score b{font-size:44px;line-height:1;color:var(--pri)}
.score i{position:absolute;left:0;bottom:0;height:4px;width:100%;background:var(--line);border-radius:2px}
.score i::after{content:"";position:absolute;inset:0;width:var(--w);background:var(--pri);border-radius:2px}
.list{list-style:none;padding:0;margin:0 0 16px}.list>li{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:18px 20px;margin-bottom:12px}
.list h3{margin:0 0 6px;font-size:17px;display:flex;flex-wrap:wrap;align-items:baseline;gap:8px}.list h3 span{color:var(--pri);font-family:Georgia,serif}
.list small{color:var(--mute);font-weight:400;font-size:14px}.list ul{margin:0 0 6px;padding-left:20px}.list a{color:var(--pri);font-size:14px}
.cta p{margin:0 0 12px;font-weight:600}.cta a:not(.btn){margin-left:12px;color:var(--pri)}
footer{color:var(--mute);font-size:13px;margin-top:32px}footer a{color:inherit}
@media(max-width:520px){form{flex-direction:column}h1{font-size:24px}.cta a:not(.btn){display:block;margin:12px 0 0}}
</style></head><body><div class="wrap">
<h1>AI 自動化潛力檢測</h1><p class="sub">輸入公司官網，找出網站上看得到、適合交給 AI 自動處理的流程。</p>
<form method="get"><input name="url" value="${esc(q)}" placeholder="例如 example.com.tw" required aria-label="官網網址"><button>開始檢測</button></form>
${body}
<footer>開源專案 v${VERSION}・只讀取首頁公開內容、不儲存任何資料・<a href="https://github.com/yufan-code/ai-automation-checker" rel="noopener">GitHub</a>・由 <a href="https://ai.hostswp.com/" rel="noopener">澄熠 LUCEVO</a> 製作</footer>
</div></body></html>`;
}

export default {
  async fetch(req) {
    const u = new URL(req.url);
    const q = u.searchParams.get("url") || "";
    if (u.pathname === "/api/check") {
      if (!q) return Response.json({ ok: false, error: "缺少 url 參數" }, { status: 400 });
      let r; try { r = await check(q); } catch (e) { r = { ok: false, error: e.message }; }
      return Response.json(r, { headers: { "Access-Control-Allow-Origin": "*" } });
    }
    if (u.pathname !== "/") return new Response("Not found", { status: 404 });
    let r = null;
    if (q) { try { r = await check(q); } catch (e) { r = { ok: false, error: e.message }; } }
    return new Response(page(q, r), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  },
};
