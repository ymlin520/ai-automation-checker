// AI 自動化潛力檢測：讀一個官網首頁，找出「重複性工作」的線索，給分數與建議
// Node 18+ 與 Cloudflare Workers 共用，不需要任何套件
export const VERSION = "1.0.0";
const UA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 ai-automation-checker/${VERSION}`;
const MAX = 400000;
const SITE = "https://ai.hostswp.com";
const READS = {
  "/ai-adoption/": "AI導入懶人包", "/ai-adoption/cases/": "AI導入案例", "/ai-adoption/process/": "AI導入流程",
  "/ai-adoption/tools/": "AI導入工具怎麼選", "/ai-adoption/roi/": "AI導入效益怎麼算",
  "/ai-automation-workflow-cases/": "AI自動化工作流案例", "/workflow-audit-handover/": "流程盤點與接手",
};

// 每個線索：判斷方式、代表的流程、可以怎麼自動化、延伸閱讀
export const SIGNALS = [
  {
    code: "form", label: "詢價／聯絡表單",
    test: ({ html, low }) => /<form[\s\S]{0,3000}?(詢價|報價|聯絡|聯繫|inquiry|contact|quote|留言)/i.test(html) || /wpcf7|elementor-form|gform_|forminator|wpforms/.test(low),
    flow: "客戶留言、詢價",
    ideas: ["表單送出後自動寄確認信給客戶", "依內容自動分類（詢價／客服／合作）並通知對應的人", "自動建檔到試算表或 CRM，不用再手動複製貼上"],
    read: "/ai-adoption/cases/",
  },
  {
    code: "shop", label: "線上購物／訂單",
    test: ({ low }) => /woocommerce|shopify|cyberbiz|shopline|91app|add-to-cart|加入購物車/.test(low),
    flow: "訂單處理、出貨",
    ideas: ["新訂單自動同步到出貨表、通知倉庫", "付款異常、地址不完整自動提醒", "庫存低於安全量自動通知"],
    read: "/ai-automation-workflow-cases/",
  },
  {
    code: "booking", label: "預約／報名流程",
    test: ({ txt }) => /預約|掛號|訂位|訂房|booking|reserve|試聽|報名/i.test(txt),
    flow: "預約、報名",
    ideas: ["預約成立自動寄確認與前一天提醒", "改期、取消自動更新行事曆", "每日預約名單自動彙整給現場人員"],
    read: "/ai-adoption/process/",
  },
  {
    code: "line", label: "LINE 官方帳號",
    test: ({ low }) => /line\.me\/|lin\.ee\//.test(low),
    flow: "LINE 客服訊息",
    ideas: ["常見問題由 AI 先回答，複雜問題再轉真人", "訊息自動分類、標記待處理", "把對話重點整理成客戶紀錄"],
    read: "/ai-adoption/tools/",
  },
  {
    code: "recruit", label: "徵才／招募",
    test: ({ txt, low }) => /徵才|人才招募|職缺|加入我們/.test(txt) || /104\.com\.tw|1111\.com\.tw|yourator|cakeresume/.test(low),
    flow: "履歷收件、面試安排",
    ideas: ["履歷自動整理成一覽表並摘要重點", "依條件初步篩選、標記優先順序", "面試時間確認信自動發送"],
    read: "/ai-adoption/cases/",
  },
  {
    code: "global", label: "外語頁面（國際客戶）",
    test: ({ html }) => /hreflang|\/en\/|lang=["']en|english|日本語/i.test(html),
    flow: "外語詢價、國際業務",
    ideas: ["外語詢價信自動翻譯並摘要重點", "產品資料一次產出多語版本", "依時區排程回覆與追蹤"],
    read: "/ai-adoption/tools/",
  },
  {
    code: "catalog", label: "產品／型號多",
    test: ({ txt }) => /產品型錄|產品介紹|產品規格|product|catalog|型號/i.test(txt),
    flow: "產品資料、報價",
    ideas: ["產品規格整理成 AI 可查詢的知識庫", "依詢價內容自動帶出對應型號與報價單草稿", "型錄更新後自動同步到網站與業務資料"],
    read: "/ai-adoption/roi/",
  },
  {
    code: "branch", label: "多個據點／門市",
    test: ({ txt }) => /門市|分店|據點|分公司|營業所|服務處/.test(txt),
    flow: "各據點報表",
    ideas: ["各據點每日數字自動彙整成一張報表", "異常數字（營收、客訴）自動通知主管", "各點公告、排班資訊一次發送"],
    read: "/workflow-audit-handover/",
  },
  {
    code: "faq", label: "常見問題頁",
    test: ({ txt, low }) => /常見問題|q&a|faq/i.test(txt) || /faqpage/.test(low),
    flow: "重複回答同樣的問題",
    ideas: ["把常見問題做成 AI 客服知識庫", "客服回覆前自動附上建議答案", "統計最常被問的問題，回頭改善網站內容"],
    read: "/ai-adoption/",
  },
  {
    code: "download", label: "型錄／文件下載",
    test: ({ low }) => /href=["'][^"']+\.(pdf|docx?|xlsx?)["']/.test(low),
    flow: "文件整理與更新",
    ideas: ["PDF 型錄、規格書自動擷取成結構化資料", "文件更新時自動通知業務與客戶", "下載名單自動進入後續追蹤"],
    read: "/ai-adoption/roi/",
  },
];

const CMS = [["joomla", "Joomla"], ["drupal", "Drupal"], ["shopify", "Shopify"], ["wix.com", "Wix"], ["weebly", "Weebly"], ["squarespace", "Squarespace"],
  ["cyberbiz", "Cyberbiz"], ["shopline", "SHOPLINE"], ["91app", "91APP"], ["waca", "WACA"], ["strikingly", "Strikingly"], ["sites.google.com", "Google 協作平台"],
  ["pixnet", "痞客邦"], ["blogspot", "Blogger"], ["jimdo", "Jimdo"]];

export function detectCms(html) {
  const low = html.toLowerCase();
  const gen = ((html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']generator["']/i) || [])[1] || "").toLowerCase();
  if (gen.includes("wordpress") || low.includes("/wp-content/") || low.includes("/wp-includes/")) return "WordPress";
  for (const [k, v] of CMS) if (gen.includes(k) || low.includes(k)) return v;
  return "其他／自建";
}

// 擋掉本機與內網位址，避免網頁版被拿來掃內網
export function normalizeUrl(input) {
  let s = String(input || "").trim();
  if (!s) throw new Error("請輸入網址");
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  const u = new URL(s);
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || h.includes(":") || /^\[/.test(h)
    || /^(127|10|0)\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || !h.includes("."))
    throw new Error("只能檢測公開網站");
  return u.href;
}

export async function fetchPage(url, ms = 12000) {
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.5" }, redirect: "follow", signal: AbortSignal.timeout(ms) });
  const buf = (await r.arrayBuffer()).slice(0, MAX);
  let cs = ((r.headers.get("content-type") || "").match(/charset=([\w-]+)/i) || [])[1];
  if (!cs) cs = (new TextDecoder().decode(buf.slice(0, 3000)).match(/<meta[^>]+charset=["']?([\w-]+)/i) || [])[1] || "utf-8";
  let html;
  try { html = new TextDecoder(cs.toLowerCase()).decode(buf); } catch { html = new TextDecoder().decode(buf); }
  return { status: r.status, html, final: r.url || url };
}

export function analyze(html) {
  const low = html.toLowerCase();
  const txt = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const found = SIGNALS.filter(s => s.test({ html, low, txt }));
  const score = Math.min(100, 20 + found.length * 10);
  const level = score >= 60 ? "高" : score >= 40 ? "中" : "低";
  const title = ((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return {
    title, cms: detectCms(html), score, level,
    signals: found.map(s => ({ code: s.code, label: s.label, flow: s.flow, ideas: s.ideas, read: SITE + s.read, readTitle: READS[s.read] })),
  };
}

export async function check(input) {
  const url = normalizeUrl(input);
  let p;
  try { p = await fetchPage(url); }
  catch (e) { return { ok: false, url, error: `網站打不開（${e.name === "TimeoutError" ? "逾時" : e.message}）` }; }
  if (p.status >= 400) return { ok: false, url, error: `網站回應 HTTP ${p.status}${[401, 403, 429, 503].includes(p.status) ? "，可能有防護擋掉自動檢測" : ""}` };
  return { ok: true, url: p.final, checkedAt: new Date().toISOString(), ...analyze(p.html), more: { guide: SITE + "/ai-adoption/", consult: SITE + "/ai-consulting-2/" } };
}
