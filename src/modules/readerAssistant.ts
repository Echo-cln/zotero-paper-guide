type PageChunk = { page: number; text: string };
type ChatEntry = {
  role: "user" | "assistant";
  text: string;
  sources?: PageChunk[];
};
type ProviderProfile = {
  id: string;
  name: string;
  baseURL: string;
  model: string;
  apiKey: string;
  protocol: "chat-completions" | "responses";
};

const PLUGIN_ID = "paperguide@zotero-paper-guide";
const PREF = "extensions.zotero.paperguide";
const conversations = new Map<number, ChatEntry[]>();
const panels = new WeakMap<object, HTMLElement>();
const pageCache = new Map<number, PageChunk[]>();
const selectionSnapshots = new WeakMap<object, string>();
const selectionListeners = new WeakMap<
  object,
  { doc: Document; handler: () => void }
>();
const registeredSelectionListeners = new Set<{
  doc: Document;
  handler: () => void;
}>();

const styles = `
:host { all: initial; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #30343b; --pg-primary:#3f6f91; --pg-primary-strong:#315b78; --pg-primary-soft:#eef4f8; --pg-primary-border:#d5e1e9; --pg-ink:#30343b; }
* { box-sizing: border-box; }
.pg-shell { position: fixed; inset: 0 0 0 auto; width: 390px; max-width: 48vw; z-index: 2147483000; background:#fbfcfd; border-left:1px solid #dbe2e8; box-shadow:-10px 0 28px #1020301a; display:flex; flex-direction:column; font-size:13px; }
.pg-shell.bottom { inset:auto 0 0 0; width:100%; max-width:none; height:38vh; border-left:0; border-top:1px solid #dbe2e8; box-shadow:0 -8px 24px #10203016; }
.pg-shell.collapsed { inset:0 0 auto auto; width:190px; height:46px; max-width:none; border-radius:0 0 0 10px; }
.pg-shell.collapsed .pg-tabs,.pg-shell.collapsed .pg-main,.pg-shell.collapsed .pg-actions,.pg-shell.collapsed .pg-status,.pg-shell.collapsed .pg-compose { display:none; }
.pg-head { height:46px; display:flex; align-items:center; justify-content:space-between; padding:0 13px; border-bottom:1px solid #e6ebef; background:#fff; flex:none; }
.pg-title { font-size:14px; font-weight:650; color:#172b3d; }
.pg-controls { display:flex; gap:6px; }
button { font:inherit; border:0; cursor:pointer; color:#334155; }
.pg-icon { background:transparent; border-radius:6px; padding:6px 8px; }
.pg-icon:hover { background:#f1f3f5; }
.pg-tabs { display:flex; gap:4px; padding:8px 12px 0; border-bottom:1px solid #e6ebef; background:#fff; flex:none; }
.pg-tab { background:transparent; padding:8px 10px; border-bottom:2px solid transparent; color:#64748b; }
.pg-tab.active { color:var(--pg-primary-strong); border-color:var(--pg-primary); font-weight:600; }
.pg-main { min-height:0; overflow:auto; padding:14px; flex:1; }
.pg-stage { padding:12px 13px; background:#f4f7f9; border:1px solid #e1e8ed; border-radius:8px; margin-bottom:12px; }
.pg-kicker { color:#536d80; font-size:11px; font-weight:700; letter-spacing:.03em; text-transform:uppercase; margin-bottom:6px; }
.pg-stage p { margin:0; line-height:1.55; color:#34475a; }
.pg-msg { margin:10px 0; padding:10px 12px; border-radius:10px; line-height:1.55; white-space:pre-wrap; overflow-wrap:anywhere; }
.pg-msg.user { background:#eef4f8; margin-left:22px; }
.pg-msg.assistant { background:#fff; border:1px solid #e4e9ed; margin-right:6px; }
.pg-cite { display:block; margin-top:9px; padding:8px; background:#f8fafb; border:1px solid #e5eaee; border-radius:8px; color:#526274; font-size:12px; }
.pg-cite button { color:var(--pg-primary-strong); background:transparent; font-weight:600; padding:0; margin-left:8px; }
.pg-actions { display:flex; gap:7px; flex-wrap:wrap; padding:8px 12px; border-top:1px solid #e6ebef; background:#fff; flex:none; }
.pg-action { background:#f6f8fa; border:1px solid #e0e6eb; border-radius:7px; padding:7px 9px; font-size:12px; }
.pg-action:hover { background:#edf2f5; }
.pg-compose { display:flex; gap:8px; padding:10px 12px 12px; border-top:1px solid #e6ebef; background:#fff; flex:none; }
textarea { font:inherit; resize:vertical; min-height:39px; max-height:130px; flex:1; padding:10px; border:1px solid #d7e0e6; border-radius:8px; outline:none; }
textarea:focus,input:focus { border-color:#7293aa; box-shadow:0 0 0 2px #3f6f911c; }
.pg-send { background:#3f6f91; color:#fff; border-radius:7px; padding:0 13px; font-weight:600; }
.pg-send:disabled { opacity:.55; cursor:wait; }
.pg-outline { list-style:none; margin:0; padding:0; }
.pg-outline li { border-radius:6px; margin:2px 0; }
.pg-outline button { width:100%; text-align:left; background:transparent; padding:8px 9px; border-radius:6px; }
.pg-outline button:hover { background:#f1f4f6; }
.pg-outline .depth-1 { padding-left:22px; }
.pg-settings label { display:block; color:#64748b; margin:12px 0 5px; }
.pg-settings input,.pg-settings select { width:100%; padding:9px; border:1px solid #d7e0e6; border-radius:7px; background:white; font:inherit; }
.pg-status { padding:0 13px 9px; color:#728096; font-size:11px; }
.pg-hidden { display:none!important; }
.pg-shell.settings-open .pg-actions,.pg-shell.settings-open .pg-compose { display:none; }
`;

function prefGet(key: string, fallback = "") {
  try {
    return (Zotero.Prefs.get(`${PREF}.${key}`, true) as string) || fallback;
  } catch {
    return fallback;
  }
}

function prefSet(key: string, value: string) {
  Zotero.Prefs.set(`${PREF}.${key}`, value, true);
}

function providers(): ProviderProfile[] {
  try {
    const value = JSON.parse(prefGet("providers", "[]"));
    if (Array.isArray(value) && value.length) return value;
  } catch {
    /* use the legacy single-provider preferences */
  }
  return [
    {
      id: "default",
      name: "我的模型",
      baseURL: prefGet("baseURL", "https://api.openai.com/v1"),
      model: prefGet("model", "gpt-4o-mini"),
      apiKey: prefGet("apiKey"),
      protocol: "chat-completions",
    },
  ];
}

function currentProvider(): ProviderProfile {
  const all = providers();
  return (
    all.find((p) => p.id === prefGet("activeProvider", "default")) ?? all[0]
  );
}

function queryAll<T extends Element>(root: ParentNode, selector: string): T[] {
  return Array.from(root.querySelectorAll(selector)) as T[];
}

function activeItemId(reader: any): number | undefined {
  return (
    reader?._item?.id ?? reader?._itemID ?? reader?.itemID ?? reader?.item?.id
  );
}

function readerWindow(reader: any): Window | undefined {
  return (
    reader?._iframeWindow ??
    reader?._internalReader?._primaryView?._iframeWindow ??
    reader?._internalReader?._primaryView?._iframe?.contentWindow ??
    reader?._iframe?.contentWindow
  );
}

function readerDocument(reader: any): Document | undefined {
  const view = readerWindow(reader);
  return (
    view?.document ??
    reader?._internalReader?._primaryView?._iframe?.contentDocument
  );
}

function openReaderAt(reader: any, page: number, quote = "") {
  const win = readerWindow(reader);
  const app = win?.PDFViewerApplication;
  if (!app) return;
  app.pdfViewer.currentPageNumber = Math.max(1, page);
  if (quote && app.findController?.executeCommand) {
    app.findController.executeCommand("find", {
      query: quote.slice(0, 180),
      highlightAll: true,
      caseSensitive: false,
    });
  }
}

async function getPageChunks(reader: any): Promise<PageChunk[]> {
  const itemId = activeItemId(reader);
  if (itemId && pageCache.has(itemId)) return pageCache.get(itemId)!;
  const win = readerWindow(reader);
  const doc = win?.PDFViewerApplication?.pdfDocument;
  if (!doc?.numPages)
    throw new Error("无法读取当前 PDF。请确认 PDF 已打开且不是受保护文件。");
  const pages: PageChunk[] = [];
  for (let pageNo = 1; pageNo <= doc.numPages; pageNo++) {
    const page = await doc.getPage(pageNo);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) pages.push({ page: pageNo, text });
  }
  if (itemId) pageCache.set(itemId, pages);
  return pages;
}

async function getOutlineEntries(
  reader: any,
): Promise<Array<{ title: string; page: number; depth: number }>> {
  const win = readerWindow(reader);
  const pdf = win?.PDFViewerApplication?.pdfDocument;
  if (!pdf) return [];
  const outline = await pdf.getOutline?.();
  if (!outline?.length) return [];
  const entries: Array<{ title: string; page: number; depth: number }> = [];
  const walk = async (nodes: any[], depth: number) => {
    for (const node of nodes) {
      let page = 1;
      try {
        const dest =
          typeof node.dest === "string"
            ? await pdf.getDestination(node.dest)
            : node.dest;
        if (dest?.[0]) page = (await pdf.getPageIndex(dest[0])) + 1;
      } catch {
        /* keep a safe first-page fallback if a bookmark destination is malformed */
      }
      entries.push({ title: node.title || "未命名章节", page, depth });
      if (node.items?.length) await walk(node.items, depth + 1);
    }
  };
  await walk(outline, 0);
  return entries;
}

function rankPages(
  pages: PageChunk[],
  query: string,
  selectedText: string,
  limit = 6,
): PageChunk[] {
  if (selectedText.trim()) {
    const selected = selectedText.trim();
    const exact = pages.find((p) =>
      p.text.toLowerCase().includes(selected.slice(0, 90).toLowerCase()),
    );
    if (exact)
      return [
        {
          page: exact.page,
          text: exact.text.slice(
            Math.max(
              0,
              exact.text
                .toLowerCase()
                .indexOf(selected.slice(0, 60).toLowerCase()),
            ) - 220,
            Math.max(
              0,
              exact.text
                .toLowerCase()
                .indexOf(selected.slice(0, 60).toLowerCase()),
            ) + 1500,
          ),
        },
      ];
  }
  const terms =
    query.toLowerCase().match(/[a-z0-9]{3,}|[\u4e00-\u9fff]{2,}/g) ?? [];
  return pages
    .map((p) => ({
      ...p,
      score: terms.reduce(
        (n, t) => n + (p.text.toLowerCase().split(t).length - 1),
        0,
      ),
    }))
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit)
    .map(({ page, text, score }: any) => {
      const lower = text.toLowerCase();
      const term = terms.find((t: string) => lower.includes(t));
      const at = term ? lower.indexOf(term) : 0;
      const start = Math.max(0, at - 450);
      return { page, text: text.slice(start, start + 1600) };
    });
}

async function askModel(
  query: string,
  context: PageChunk[],
  history: ChatEntry[],
): Promise<string> {
  const provider = currentProvider();
  const baseURL = provider.baseURL.replace(/\/$/, "");
  const apiKey = provider.apiKey;
  const model = provider.model;
  if (!apiKey) throw new Error("请先在模型设置中填写 API Key。");
  const excerpt = context
    .map((s) => `[PDF第${s.page}页]\n${s.text}`)
    .join("\n\n---\n\n");
  const messages = [
    {
      role: "system",
      content:
        "你是论文阅读导师。先回答用户具体问题，必要时解释术语、公式与前后逻辑。只能根据给出的论文片段断言论文内容；每个关键事实都以[PDF第N页]标注来源。若证据不足，明确说明并指出需要查看的部分。用中文回答，保留必要英文术语。",
    },
    ...history.slice(-8).map((m) => ({ role: m.role, content: m.text })),
    {
      role: "user",
      content: `问题：${query}\n\n以下是从当前论文检索到的原文片段：\n${excerpt}`,
    },
  ];
  const useResponses = provider.protocol === "responses";
  const response = await fetch(
    `${baseURL}/${useResponses ? "responses" : "chat/completions"}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(
        useResponses
          ? {
              model,
              instructions: messages[0].content,
              input: messages.slice(1).map((m) => ({
                role: m.role,
                content: [{ type: "input_text", text: m.content }],
              })),
            }
          : { model, messages, temperature: 0.2 },
      ),
    },
  );
  if (!response.ok)
    throw new Error(
      `模型请求失败 (${response.status})：${(await response.text()).slice(0, 260)}`,
    );
  const data: any = await response.json();
  if (!useResponses)
    return data.choices?.[0]?.message?.content ?? "模型没有返回文本。";
  const output = (data.output ?? [])
    .flatMap((item: any) => item.content ?? [])
    .filter((item: any) => item.type === "output_text")
    .map((item: any) => item.text)
    .join("\n");
  return output || "模型没有返回文本。";
}

function addNote(itemId: number, entries: ChatEntry[]) {
  const parent = Zotero.Items.get(itemId);
  const note = new Zotero.Item("note");
  note.libraryID = parent.libraryID;
  note.parentID = parent.parentID || parent.id;
  const esc = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  const body = entries
    .map(
      (entry) =>
        `<h3>${entry.role === "user" ? "提问" : "Paper Guide"}</h3><p>${esc(entry.text).replace(/\n/g, "<br>")}</p>${(entry.sources ?? []).map((s) => `<blockquote><p>${esc(s.text)}</p><p>PDF 第 ${s.page} 页</p></blockquote>`).join("")}`,
    )
    .join("<hr>");
  note.setNote(`<h2>Paper Guide 阅读问答</h2>${body}`);
  return note.saveTx();
}

function panelMarkup() {
  return `<div class="pg-shell">
    <header class="pg-head"><span class="pg-title">Paper Guide</span><div class="pg-controls"><button class="pg-icon" data-action="layout" title="切换侧栏/底栏">⇄</button><button class="pg-icon" data-action="collapse" title="收起">—</button><button class="pg-icon" data-action="close" title="关闭">×</button></div></header>
    <nav class="pg-tabs"><button class="pg-tab active" data-tab="guided">Guided Reading</button><button class="pg-tab" data-tab="chat">对话</button><button class="pg-tab" data-tab="outline">目录</button><button class="pg-tab" data-tab="settings">模型</button></nav>
    <main class="pg-main"><div data-view="guided"><section class="pg-stage"><div class="pg-kicker">当前阅读</div><p>我先按论文结构带你读；你可以随时追问细节，再点引用回到原文。</p><button class="pg-action" data-action="start-guided" style="margin-top:9px">开始带读：从摘要与引言开始</button></section><div data-messages></div></div><div data-view="chat" class="pg-hidden"><div data-messages-chat></div></div><div data-view="outline" class="pg-hidden"><div class="pg-kicker">论文目录</div><ul class="pg-outline" data-outline><li>正在读取 PDF 大纲…</li></ul><div class="pg-kicker" style="margin-top:18px">页面缩略图</div><div data-thumbnails></div></div><div data-view="settings" class="pg-settings pg-hidden"><div class="pg-stage"><div class="pg-kicker">模型供应商</div><p>可保存多组第三方模型配置并随时切换。API 密钥仅保存在本机 Zotero 配置中。</p></div><label>当前供应商</label><select data-provider-select></select><button class="pg-action" data-action="add-provider" style="margin-top:8px">＋ 添加供应商</button><label>供应商名称</label><input data-setting="name" placeholder="例如 SiliconFlow / OpenRouter"><label>API Base URL</label><input data-setting="baseURL" placeholder="https://api.example.com/v1"><label>模型名称</label><input data-setting="model" placeholder="例如 gpt-4o-mini"><label>接口协议</label><select data-setting="protocol"><option value="chat-completions">OpenAI Chat Completions</option><option value="responses">OpenAI Responses（Codex 兼容供应商）</option></select><label>API Key</label><input data-setting="apiKey" type="password" placeholder="sk-…"><button class="pg-action" data-action="save-settings" style="margin-top:12px">保存供应商设置</button><p class="pg-status">Codex 的原生账号/本地代理接入作为单独适配器继续验证；兼容 Responses API 的供应商可先直接使用。</p></div></main>
    <footer class="pg-actions"><button class="pg-action" data-action="save-note">保存对话到论文笔记</button><button class="pg-action" data-action="summary">总结本次问答</button><button class="pg-action" data-action="highlight">定位选中文字</button></footer>
    <div class="pg-status" data-status>已连接当前 PDF 阅读器</div>
    <form class="pg-compose"><textarea placeholder="问这篇论文，或先在 PDF 中选中一段文字…"></textarea><button class="pg-send" type="submit">提问</button></form>
  </div>`;
}

function createPanel(reader: any, selectedText = "") {
  const prior = panels.get(reader);
  if (prior?.isConnected) {
    prior.shadowRoot?.querySelector("textarea")?.focus();
    return prior;
  }
  const doc = readerDocument(reader);
  if (!doc?.body) return null;
  const host = doc.createElement("div");
  host.id = "paper-guide-host";
  const shadow = host.attachShadow({ mode: "open" }) as ShadowRoot;
  shadow.innerHTML = `<style>${styles}</style>${panelMarkup()}`;
  doc.body.append(host);
  panels.set(reader, host);
  const itemId = activeItemId(reader);
  const entries = itemId ? (conversations.get(itemId) ?? []) : [];
  const renderMessages = () => {
    for (const target of [
      shadow.querySelector("[data-messages]"),
      shadow.querySelector("[data-messages-chat]"),
    ]) {
      if (!target) continue;
      target.replaceChildren();
      entries.forEach((entry) => {
        const msg = doc.createElement("div");
        msg.className = `pg-msg ${entry.role}`;
        msg.textContent = entry.text;
        if (entry.sources?.length)
          entry.sources.forEach((source) => {
            const cite = doc.createElement("div");
            cite.className = "pg-cite";
            cite.append(
              doc.createTextNode(
                `第 ${source.page} 页 · 原文片段：${source.text.slice(0, 150)}… `,
              ),
            );
            const jump = doc.createElement("button");
            jump.textContent = "跳回原文";
            jump.onclick = () => openReaderAt(reader, source.page, source.text);
            cite.append(jump);
            msg.append(cite);
          });
        target.append(msg);
      });
      target.scrollTop = target.scrollHeight;
    }
  };
  const status = shadow.querySelector<HTMLElement>("[data-status]");
  const textarea = shadow.querySelector<HTMLTextAreaElement>("textarea")!;
  if (selectedText)
    textarea.value = `请解释这段原文，并说明它与本节及前文的关系：\n\n“${selectedText}”`;
  const providerSelect = shadow.querySelector<HTMLSelectElement>(
    "[data-provider-select]",
  )!;
  const refreshProviders = (selectedId?: string) => {
    providerSelect.replaceChildren();
    providers().forEach((p) => {
      const option = doc.createElement("option");
      option.value = p.id;
      option.textContent = p.name;
      providerSelect.append(option);
    });
    providerSelect.value =
      selectedId ?? prefGet("activeProvider", providers()[0].id);
    const selected =
      providers().find((p) => p.id === providerSelect.value) ?? providers()[0];
    for (const input of queryAll<HTMLInputElement>(shadow, "[data-setting]"))
      input.value = (selected as any)[input.dataset.setting!] ?? "";
    const protocol = shadow.querySelector<HTMLSelectElement>(
      '[data-setting="protocol"]',
    );
    if (protocol) protocol.value = selected.protocol;
  };
  refreshProviders();
  providerSelect.onchange = () => {
    prefSet("activeProvider", providerSelect.value);
    refreshProviders(providerSelect.value);
  };
  const tabs = queryAll<HTMLButtonElement>(shadow, "[data-tab]");
  tabs.forEach(
    (tab) =>
      (tab.onclick = () => {
        tabs.forEach((t) => t.classList.toggle("active", t === tab));
        shadow
          .querySelector(".pg-shell")
          ?.classList.toggle("settings-open", tab.dataset.tab === "settings");
        queryAll<HTMLElement>(shadow, "[data-view]").forEach((v: HTMLElement) =>
          v.classList.toggle("pg-hidden", v.dataset.view !== tab.dataset.tab),
        );
      }),
  );
  const submitQuestion = async (question: string) => {
    if (!question || !itemId) return;
    entries.push({ role: "user", text: question });
    renderMessages();
    const send = shadow.querySelector<HTMLButtonElement>(".pg-send")!;
    send.disabled = true;
    if (status) status.textContent = "正在读取论文并检索相关段落…";
    try {
      const pages = await getPageChunks(reader);
      const context = question.startsWith("[GUIDED_READING]")
        ? pages.slice(0, 6)
        : rankPages(pages, question, selectedText);
      if (status) status.textContent = "正在请求模型…";
      const prompt = question.replace("[GUIDED_READING]", "");
      const answer = await askModel(prompt, context, entries.slice(0, -1));
      const citedSources = context.filter(
        (source) =>
          answer.includes(`第${source.page}页`) ||
          answer.includes(`第 ${source.page} 页`) ||
          answer.includes(`[PDF第${source.page}页]`),
      );
      entries.push({
        role: "assistant",
        text: answer,
        sources: citedSources.length ? citedSources : context.slice(0, 2),
      });
      conversations.set(itemId, entries);
      renderMessages();
      if (status)
        status.textContent = "回答已生成；点击引用可跳回 PDF 页面并查找原句。";
    } catch (error) {
      entries.push({
        role: "assistant",
        text: `暂时无法回答：${(error as Error).message}`,
      });
      renderMessages();
      if (status) status.textContent = `请求失败：${(error as Error).message}`;
    } finally {
      send.disabled = false;
    }
  };
  shadow.querySelector<HTMLFormElement>("form")!.onsubmit = async (event) => {
    event.preventDefault();
    const question = textarea.value.trim();
    if (!question) return;
    textarea.value = "";
    await submitQuestion(question);
  };
  shadow
    .querySelector('[data-action="start-guided"]')!
    .addEventListener("click", () => {
      void submitQuestion(
        "[GUIDED_READING] 请带我读这篇论文。先根据摘要和引言说明：1）研究问题和背景；2）作者认为现有方法哪里不足；3）本文核心思路是什么。先讲第一步，解释关键概念并引用对应 PDF 页码，结尾用一个问题检查我是否理解，再等我追问或继续。不要一次讲完整篇论文。 ",
      );
    });
  shadow
    .querySelector('[data-action="close"]')!
    .addEventListener("click", () => host.remove());
  shadow
    .querySelector('[data-action="collapse"]')!
    .addEventListener("click", () => host.classList.toggle("collapsed"));
  shadow
    .querySelector('[data-action="layout"]')!
    .addEventListener("click", () =>
      shadow.querySelector(".pg-shell")!.classList.toggle("bottom"),
    );
  shadow
    .querySelector('[data-action="save-settings"]')!
    .addEventListener("click", () => {
      const all = providers();
      const index = Math.max(
        0,
        all.findIndex((p) => p.id === providerSelect.value),
      );
      const updated = { ...all[index] } as ProviderProfile;
      for (const input of queryAll<HTMLInputElement>(shadow, "[data-setting]"))
        (updated as any)[input.dataset.setting!] = input.value.trim();
      const protocol = shadow.querySelector<HTMLSelectElement>(
        '[data-setting="protocol"]',
      );
      if (protocol)
        updated.protocol = protocol.value as ProviderProfile["protocol"];
      all[index] = updated;
      prefSet("providers", JSON.stringify(all));
      prefSet("activeProvider", updated.id);
      if (status) status.textContent = "模型设置已保存在本机 Zotero 配置中。";
    });
  shadow
    .querySelector('[data-action="add-provider"]')!
    .addEventListener("click", () => {
      const all = providers();
      const profile: ProviderProfile = {
        id: `provider-${Date.now()}`,
        name: `供应商 ${all.length + 1}`,
        baseURL: "",
        model: "",
        apiKey: "",
        protocol: "chat-completions",
      };
      all.push(profile);
      prefSet("providers", JSON.stringify(all));
      prefSet("activeProvider", profile.id);
      refreshProviders(profile.id);
    });
  shadow
    .querySelector('[data-action="save-note"]')!
    .addEventListener("click", async () => {
      if (!itemId || !entries.length) {
        if (status) status.textContent = "当前还没有可保存的问答。";
        return;
      }
      try {
        await addNote(itemId, entries);
        if (status) status.textContent = "已保存到该论文的 Zotero 笔记。";
      } catch (e) {
        if (status) status.textContent = `保存失败：${(e as Error).message}`;
      }
    });
  shadow
    .querySelector('[data-action="summary"]')!
    .addEventListener("click", () => {
      const text = entries
        .map((e) => `${e.role === "user" ? "问题" : "回答"}：${e.text}`)
        .join("\n\n");
      textarea.value = `请根据本次阅读问答总结：关键疑问、已经理解的结论、仍未解决的问题。\n\n${text}`;
      textarea.focus();
    });
  shadow
    .querySelector('[data-action="highlight"]')!
    .addEventListener("click", () => {
      if (selectedText)
        openReaderAt(
          reader,
          reader?._lastFocusedPageIndex + 1 || 1,
          selectedText,
        );
      if (status)
        status.textContent = selectedText
          ? "已在 PDF 中定位选中文字，可使用 Zotero 原生高亮工具创建标注。"
          : "请先在 PDF 中选中一段文字。";
    });
  void Promise.all([getPageChunks(reader), getOutlineEntries(reader)])
    .then(async ([pages, bookmarks]) => {
      const outline = shadow.querySelector<HTMLElement>("[data-outline]");
      if (!outline) return;
      outline.replaceChildren();
      const headings = pages.flatMap((p) =>
        [
          ...p.text.matchAll(
            /(?:^|\s)(\d+(?:\.\d+){0,3})\s+([A-Z][^.!?]{3,90})/g,
          ),
        ].map((m) => ({ page: p.page, label: `${m[1]} ${m[2].trim()}` })),
      );
      const seen = new Set<string>();
      const navItems = bookmarks.length
        ? bookmarks.map((b) => ({
            page: b.page,
            label: b.title,
            depth: b.depth,
          }))
        : headings.length
          ? headings.map((h) => ({ ...h, depth: 0 }))
          : pages.map((p) => ({
              page: p.page,
              label: `第 ${p.page} 页`,
              depth: 0,
            }));
      navItems.forEach((h) => {
        if (seen.has(h.label)) return;
        seen.add(h.label);
        const li = doc.createElement("li");
        const button = doc.createElement("button");
        button.className = h.depth > 0 ? "depth-1" : "";
        button.textContent = `${h.label} · ${h.page}`;
        button.onclick = () => openReaderAt(reader, h.page);
        li.append(button);
        outline.append(li);
      });
      const thumbs = shadow.querySelector<HTMLElement>("[data-thumbnails]");
      if (thumbs) {
        thumbs.replaceChildren();
        const win = readerWindow(reader);
        const pdf = win?.PDFViewerApplication?.pdfDocument;
        const grid = doc.createElement("div");
        grid.style.cssText =
          "display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px";
        for (
          let pageNo = 1;
          pdf && pageNo <= Math.min(pdf.numPages, 18);
          pageNo++
        ) {
          const tile = doc.createElement("button");
          tile.style.cssText =
            "background:#fff;border:1px solid #dbe3e8;border-radius:6px;padding:4px;display:flex;flex-direction:column;align-items:center;gap:4px";
          const canvas = doc.createElement("canvas");
          try {
            const page = await pdf.getPage(pageNo);
            const viewport = page.getViewport({ scale: 0.22 });
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.cssText =
              "width:100%;height:auto;border:1px solid #e8ecef;background:#fff";
            const ctx = canvas.getContext("2d");
            if (ctx)
              await page.render({ canvasContext: ctx, viewport }).promise;
          } catch {
            canvas.width = 60;
            canvas.height = 80;
          }
          const caption = doc.createElement("span");
          caption.textContent = `第 ${pageNo} 页`;
          caption.style.cssText = "font-size:10px;color:#64748b";
          tile.append(canvas, caption);
          tile.onclick = () => openReaderAt(reader, pageNo);
          grid.append(tile);
        }
        thumbs.append(grid);
      }
    })
    .catch(() => {});
  renderMessages();
  return host;
}

export function registerReaderAssistant() {
  const addToolbarButton = (event: any) => {
    const { reader, doc, append } = event;
    const selectionDoc = readerWindow(reader)?.document;
    if (selectionDoc && !selectionListeners.has(reader)) {
      const handler = () => {
        const selected = selectionDoc.getSelection()?.toString().trim();
        if (selected) selectionSnapshots.set(reader, selected);
      };
      selectionDoc.addEventListener("selectionchange", handler);
      const listener = { doc: selectionDoc, handler };
      selectionListeners.set(reader, listener);
      registeredSelectionListeners.add(listener);
    }
    if (doc.getElementById("paper-guide-reader-toolbar-button")) return;
    const button = doc.createElement("button");
    button.className = "toolbarButton";
    button.id = "paper-guide-reader-toolbar-button";
    button.title = "Paper Guide：带读与论文问答";
    button.setAttribute("aria-label", "Paper Guide：带读与论文问答");
    button.style.cssText =
      "display:inline-flex;align-items:center;justify-content:center;min-width:34px;width:34px;height:34px;padding:4px;margin:0 3px;border:1px solid #cfe5bd;border-radius:7px;background:#f2f9e9;cursor:pointer;-moz-window-dragging:no-drag;";
    const icon = doc.createElement("img");
    icon.src = "chrome://paper-guide/content/icons/paper-guide.svg";
    icon.alt = "";
    icon.width = 25;
    icon.height = 25;
    icon.draggable = false;
    button.append(icon);
    button.addEventListener("click", () => {
      const current = selectionDoc?.getSelection()?.toString().trim();
      const selectedText = current || selectionSnapshots.get(reader) || "";
      createPanel(reader, selectedText);
    });
    append(button);
  };
  Zotero.Reader.registerEventListener(
    "renderToolbar",
    addToolbarButton,
    PLUGIN_ID,
  );
  return () => {
    Zotero.Reader.unregisterEventListener("renderToolbar", addToolbarButton);
    registeredSelectionListeners.forEach(({ doc, handler }) => {
      doc.removeEventListener("selectionchange", handler);
    });
    registeredSelectionListeners.clear();
  };
}
