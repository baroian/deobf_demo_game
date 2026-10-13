"use strict";
/* Agent-Z deobfuscation game: vanilla JS, no build step.
 * All server and model text is inserted with textContent / text nodes, never innerHTML.
 * The only innerHTML below is the static icon table, which holds constant SVG strings.
 * The server never says which reply "fired" (the game is to notice that), so the star on a reply is
 * the player's own local mark, kept in this browser only. */

const $ = (id) => document.getElementById(id);

const ICON = {
  "arrow-left": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
  plug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 01-12 0zM12 18v4"/></svg>',
  external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v12l-5 5H4z"/><path d="M15 21v-5h5M8 9h8M8 13h4"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 00-14.9-3M4 5v4h4M4 13a8 8 0 0014.9 3M20 19v-4h-4"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 005 5L21 14l-7 7-3.5-3.5L3 11l3-3 3 .5 5.7-2.2z" transform="scale(.9) translate(1.2 .6)"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  starO: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 9"/></svg>',
  ban: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>',
};
const ic = (name) => { const s = document.createElement("span"); s.dataset.icon = name; s.innerHTML = ICON[name] || ""; return s; };
const hydrateIcons = (root = document) => root.querySelectorAll("[data-icon]").forEach((el) => { if (!el.firstChild) el.innerHTML = ICON[el.dataset.icon] || ""; });

const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (k === "text") e.textContent = v;
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat(Infinity)) { if (c == null || c === false) continue; e.append(c instanceof Node ? c : document.createTextNode(String(c))); }
  return e;
};

const store = {
  get(k) { try { return localStorage.getItem(k); } catch (_e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (_e) { /* private mode */ } },
  del(k) { try { localStorage.removeItem(k); } catch (_e) { /* ignore */ } },
};
const tokKey = (cellId) => "agentz_token_" + cellId;

/* ───────── state ───────── */
const S = {
  info: null, cells: [], cellMap: {}, boards: {},
  player: "", token: null, cell: null, session: null, convs: {}, selConv: null,
  marks: new Set(), view: {}, toolOpen: {}, pending: null, sending: false, forceScroll: false,
  image: "adversarial", newConv: false,
};

class ApiError extends Error { constructor(msg, status, data) { super(msg); this.status = status; this.data = data; } }

const BACKEND = (window.DEMO_BACKEND_URL || "").replace(/\/+$/, "");
const NGROK = BACKEND ? { "ngrok-skip-browser-warning": "1" } : {};
const gateToken = () => { try { return sessionStorage.getItem("agentz_gate"); } catch (_e) { return null; } };

/* The access gate is header-only (cookies do not cross sites): the token lives in sessionStorage and goes out as X-Demo-Access. */
async function ensureGate() {
  let st = { required: false, authorized: true };
  try {
    const r = await fetch(BACKEND + "/api/gate", { headers: { ...NGROK, ...(gateToken() ? { "X-Demo-Access": gateToken() } : {}) } });
    st = await r.json();
  } catch (_e) { return; }          // unreachable: boot reports it on the next call
  if (!st.required || st.authorized) return;
  const root = $("gateRoot"), form = $("gateForm"), err = $("gateErr");
  root.hidden = false; $("gatePw").focus();
  await new Promise((done) => {
    form.onsubmit = async (e) => {
      e.preventDefault(); $("gateGo").disabled = true; err.textContent = "";
      try {
        const r = await fetch(BACKEND + "/api/gate", { method: "POST", headers: { "Content-Type": "application/json", ...NGROK }, body: JSON.stringify({ password: $("gatePw").value }) });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.token) { try { sessionStorage.setItem("agentz_gate", d.token); } catch (_e) { /* ignore */ } root.hidden = true; $("gatePw").value = ""; done(); return; }
        err.textContent = d.error || "Could not sign in.";
      } catch (_e) { err.textContent = "Cannot reach the server."; }
      $("gateGo").disabled = false;
    };
  });
}

/* <img src> cannot carry the access header, so images are fetched and shown from blob URLs. */
async function blobUrl(path) {
  try {
    const r = await fetch(BACKEND + path, { headers: { ...NGROK, ...(gateToken() ? { "X-Demo-Access": gateToken() } : {}) } });
    if (!r.ok) throw new Error(String(r.status));
    return URL.createObjectURL(await r.blob());
  } catch (_e) { return BACKEND + path; }
}

async function api(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  Object.assign(headers, NGROK); if (gateToken()) headers["X-Demo-Access"] = gateToken();
  const tk = token === undefined ? S.token : token;
  if (tk) headers.Authorization = "Bearer " + tk;
  let r;
  try { r = await fetch(BACKEND + path, { method, headers, body: body ? JSON.stringify(body) : undefined }); }
  catch (_e) { throw new ApiError("Cannot reach the server. Is it still running?", 0, null); }
  let data = null; try { data = await r.json(); } catch (_e) { /* no body */ }
  if (r.status === 401 && data && /Access password/.test(data.error || "")) { try { sessionStorage.removeItem("agentz_gate"); } catch (_e) { /* ignore */ } location.reload(); throw new ApiError("Access password required.", 401, data); }
  if (!r.ok) {
    let msg = (data && (data.error || (data.detail && data.detail.map && data.detail.map((d) => d.msg).join("; ")))) || r.statusText || "Request failed";
    if (r.status === 429) { const ra = r.headers.get("Retry-After"); msg += ra ? ` Try again in ${ra} s.` : ""; }
    throw new ApiError(msg, r.status, data);
  }
  return data;
}

/* ───────── toasts ───────── */
function toast(msg, kind = "") {
  const t = h("div", { class: "toast " + kind, role: kind === "err" ? "alert" : "status" }, h("span", { text: msg }),
    h("button", { class: "x", "aria-label": "Dismiss", onclick: () => t.remove() }, "\u00d7"));
  $("toasts").append(t);
  setTimeout(() => t.remove(), kind === "err" ? 7000 : 4200);
}

/* ───────── small helpers ───────── */
const PLAYER_RE = /^[A-Za-z0-9 _.\-]{1,32}$/;
const fmtScore = (s) => (s == null ? "n/a" : Number(s).toFixed(2));
const VERDICT_LABEL = { full: "Full match", partial: "Partial match", false: "Miss", unscored: "Not scored", none: "No answer" };
const VERDICT_SHORT = { full: "FULL", partial: "PARTIAL", false: "MISS", unscored: "n/a", none: "none" };
const IMG_SHORT = { adversarial: "adversarial", clean: "clean", none: "no image" };
const initial = (n) => (n || "?").trim().charAt(0) || "?";
const nearBottom = (el) => el.scrollHeight - el.scrollTop - el.clientHeight < 80;
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

function jsonNodes(text) {
  const out = []; let last = 0;
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],:]/g;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    let cls = "j-p";
    if (m[1]) cls = m[2] ? "j-k" : "j-s"; else if (m[3]) cls = "j-b"; else if (/^-?\d/.test(tok)) cls = "j-n";
    if (m[1] && m[2]) { out.push(h("span", { class: "j-k" }, m[1]), h("span", { class: "j-p" }, m[2])); }
    else out.push(h("span", { class: cls }, tok));
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
const peek = (args) => {
  try { return Object.entries(args || {}).map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`).join(", "); }
  catch (_e) { return ""; }
};

function openModal(node, { dismissable = true } = {}) {
  const root = $("modalRoot"); root.hidden = false; root.replaceChildren(node);
  root._dismiss = dismissable ? closeModal : null;
  root.onclick = (e) => { if (e.target === root && root._dismiss) root._dismiss(); };
}
function closeModal() { const r = $("modalRoot"); r.hidden = true; r.replaceChildren(); r._dismiss = null; }

/* ───────── boot & routing ───────── */
async function boot() {
  hydrateIcons();
  await ensureGate();
  try { S.info = await api("/api/info", { token: null }); S.cells = await api("/api/cells", { token: null }); }
  catch (e) { $("cellGrid").replaceChildren(h("p", { class: "muted" }, "Could not load the game: " + e.message)); return; }
  await Promise.all(S.cells.map(async (c) => { c.image_url = await blobUrl(c.image_url); }));
  S.cellMap = Object.fromEntries(S.cells.map((c) => [c.id, c]));
  $("modeBadges").replaceChildren(h("span", {}, "victim: " + S.info.victim_name));
  if (S.info.mock_hint && !sessionStorage.getItem("agentz_notice_off")) { $("mockNotice").hidden = false; $("mockNoticeText").textContent = S.info.mock_hint; }
  $("mockNoticeClose").onclick = () => { $("mockNotice").hidden = true; try { sessionStorage.setItem("agentz_notice_off", "1"); } catch (_e) { /* ignore */ } };
  S.player = store.get("agentz_player") || "";
  $("playerInput").value = S.player;
  $("playerInput").addEventListener("input", () => { S.player = $("playerInput").value.trim(); store.set("agentz_player", S.player); $("playerInput").parentElement.parentElement.classList.remove("shake"); });
  window.addEventListener("hashchange", route);
  route();
}

function route() {
  const m = location.hash.match(/^#\/play\/([\w\-]+)/);
  if (m) loadPlay(m[1]); else showLanding();
}

/* ───────── landing ───────── */
function showLanding() {
  $("play").hidden = true; $("landing").hidden = false; $("playerChip").hidden = true; document.body.classList.remove("in-play");
  closeDrawer(); closeModal(); S.token = null; S.cell = null;
  document.title = "Agent-Z deobfuscation game";
  renderCells();
  loadCardData();
}

function renderCells() {
  $("cellGrid").replaceChildren(...S.cells.map((c, i) => cellCard(c, i)));
  hydrateIcons($("cellGrid"));
}

function cellCard(c, i) {
  const b = S.boards[c.id], sess = S.resume && S.resume[c.id];
  const best = b && b.length ? b[0] : null;
  const lb = !b ? h("span", { class: "muted" }, "Loading leaderboard\u2026")
    : best ? h("span", { class: "cell-lb" }, h("span", { class: "chip " + best.verdict }, "Best: " + VERDICT_SHORT[best.verdict]), plural(b.length, "player"))
    : h("span", { class: "cell-lb" }, h("span", { class: "chip" }, "No answers yet"), "Be the first");
  const cta = sess ? `Resume \u00b7 ${sess.usage.conversations_used}/${sess.usage.max_conversations} conversations${sess.revealed ? " \u00b7 revealed" : ""}` : "Start playing";
  return h("button", { class: "cell-card", onclick: () => startOrResume(c.id), "aria-label": `Play ${c.title}` },
    h("div", { class: "cell-thumb" }, h("img", { src: c.image_url, alt: `Image of ${c.title}`, loading: "lazy" }), h("span", { class: "cell-badge" }, "CELL " + String.fromCharCode(65 + i))),
    h("div", { class: "cell-body" },
      h("h3", {}, c.title),
      h("div", { class: "cell-meta" }, `${c.budget.max_conversations} conversations \u00d7 ${c.budget.max_turns_per_conv} turns`),
      lb,
      h("div", { class: "cell-cta" }, h("span", {}, cta), ic("arrow-left"))));
}

async function loadCardData() {
  S.resume = S.resume || {};
  await Promise.all(S.cells.map(async (c) => {
    S.boards[c.id] = await api("/api/leaderboard/" + c.id, { token: null }).catch(() => []);
    const tk = store.get(tokKey(c.id));
    if (tk) {
      try { S.resume[c.id] = await api("/api/session", { token: tk }); }
      catch (_e) { delete S.resume[c.id]; store.del(tokKey(c.id)); }
    } else delete S.resume[c.id];
  }));
  if (!$("landing").hidden) {
    renderCells();
  }
}

async function startOrResume(cellId) {
  if (store.get(tokKey(cellId))) { location.hash = "#/play/" + cellId; return; }
  const player = $("playerInput").value.trim();
  if (!PLAYER_RE.test(player)) {
    const box = $("playerInput").closest(".namebox"); box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake");
    $("playerInput").focus(); window.scrollTo({ top: 0, behavior: "smooth" });
    toast(player ? "Names use letters, digits, space, _ . - (max 32)." : "Enter a name first. It goes on the leaderboard.", "err");
    return;
  }
  store.set("agentz_player", player); S.player = player;
  try {
    const r = await api("/api/sessions", { method: "POST", body: { player, cell: cellId }, token: null });
    store.set(tokKey(cellId), r.token);
    location.hash = "#/play/" + cellId;
  } catch (e) { toast(e.message, "err"); }
}

/* ───────── play: load ───────── */
async function loadPlay(cellId) {
  const cell = S.cellMap[cellId], token = store.get(tokKey(cellId));
  if (!cell) { location.hash = "#/"; return; }
  if (!token) { toast("Pick a name and start a session for that cell first.", ""); location.hash = "#/"; return; }
  let session, convs;
  try { [session, convs] = await Promise.all([api("/api/session", { token }), api("/api/conversations", { token })]); }
  catch (e) {
    if (e.status === 401) { store.del(tokKey(cellId)); toast("That session has ended (the server restarted). Start a new one.", "err"); }
    else toast(e.message, "err");
    location.hash = "#/"; return;
  }
  S.cell = cell; S.token = token; S.session = session; S.convs = convs; S.player = session.player;
  S.pending = null; S.sending = false; S.view = {}; S.toolOpen = {};
  S.marks = new Set(JSON.parse(store.get("agentz_marks_" + session.session_id) || "[]"));
  const ids = convIds();
  S.selConv = session.usage.active_conversation || (ids.length ? ids[ids.length - 1] : null);
  S.image = cell.image_options.includes("adversarial") ? "adversarial" : cell.image_options[0];
  S.newConv = false;

  $("landing").hidden = true; $("play").hidden = false; document.body.classList.add("in-play");
  document.title = `${cell.title} \u00b7 Agent-Z deobfuscation game`;
  $("cellTitle").textContent = cell.title;
  $("cellImg").src = cell.image_url; $("imgDl").href = cell.image_url; $("imgDl").setAttribute("download", `image_${cell.id}.png`);
  $("playerChip").hidden = false; $("playerChip").replaceChildren(h("span", { class: "avatar" }, initial(session.player)), session.player);
  $("brief").textContent = "Loading\u2026";
  api(`/api/cells/${cellId}/brief`, { token: null }).then((b) => { $("brief").textContent = b.agent_system_prompt; }).catch(() => { $("brief").textContent = "(unavailable)"; });
  $("apiBase").textContent = location.origin; $("apiToken").textContent = token; $("apiToken").classList.remove("show");
  $("notesText").value = ""; $("notesState").textContent = "";
  buildControls();
  resetSubmitForm();
  renderAll();
  loadBoard();
  $("transcript").scrollTop = $("transcript").scrollHeight;
  $("msg").focus();
}

const convIds = () => Object.keys(S.convs).map(Number).sort((a, b) => a - b);

/* ───────── play: derived state ───────── */
function derived() {
  const u = S.session.usage, revealed = S.session.revealed;
  const turnsFull = !u.active_conversation || u.active_turns_used >= u.max_turns_per_conv;
  const noBudget = turnsFull && u.conversations_remaining <= 0;
  return { u, revealed, turnsFull, noBudget, locked: noBudget };
}

function renderAll() {
  renderBudget(); renderConvList(); renderTranscript(); renderComposer(); renderSubmit(); renderVerdicts();
}

/* ───────── budget & conversations ───────── */
function renderBudget() {
  const { u, noBudget } = derived();
  const pct = Math.min(100, (100 * u.conversations_used) / u.max_conversations);
  $("meterBar").style.width = pct + "%";
  const meter = $("meter"); meter.classList.toggle("warn", pct >= 80 && pct < 100); meter.classList.toggle("out", pct >= 100);
  meter.setAttribute("aria-valuemin", "0"); meter.setAttribute("aria-valuemax", String(u.max_conversations)); meter.setAttribute("aria-valuenow", String(u.conversations_used));
  $("convCount").textContent = `${u.conversations_used} / ${u.max_conversations}`;
  const st = $("budgetState");
  st.className = "chip " + (noBudget ? "warn" : ""); st.textContent = noBudget ? "spent" : `${u.conversations_remaining} left`;
  $("turnPips").replaceChildren(...Array.from({ length: u.max_turns_per_conv }, (_, i) => h("i", { class: i < u.active_turns_used ? "on" : "" })));
  $("statCalls").textContent = u.calls_used; $("statGens").textContent = u.generations_used;
}

function markCount(cid) { let n = 0; for (const k of S.marks) if (k.startsWith(cid + ":")) n++; return n; }

function renderConvList() {
  const ids = convIds().reverse();
  $("convCountChip").textContent = ids.length ? String(ids.length) : "";
  const list = $("convList");
  if (!ids.length) { list.replaceChildren(h("li", { class: "conv-empty" }, "No conversations yet. Send a message to open the first one.")); return; }
  list.replaceChildren(...ids.map((cid) => {
    const turns = S.convs[cid], first = turns[0] || {}, stars = markCount(cid);
    return h("li", {}, h("button", { class: "conv-item" + (cid === S.selConv ? " sel" : ""), onclick: () => selectConv(cid), "aria-current": cid === S.selConv ? "true" : null },
      h("span", { class: "conv-n" }, cid),
      h("span", { class: "conv-txt" },
        h("span", { class: "conv-first" }, first.user || "(empty)"),
        h("span", { class: "conv-meta" }, h("span", {}, plural(turns.length, "turn")), h("span", {}, "\u00b7"), h("span", {}, IMG_SHORT[first.image] || ""), stars ? h("span", { class: "conv-star" }, "\u2605 " + stars) : null))));
  }));
}

function selectConv(cid) { S.selConv = cid; S.forceScroll = true; renderConvList(); renderTranscript(); renderComposer(); }

/* ───────── transcript ───────── */
function toolCard(c, key, defaultOpen) {
  const open = key in S.toolOpen ? S.toolOpen[key] : defaultOpen;
  const pretty = JSON.stringify(c.arguments ?? {}, null, 2);
  const d = h("details", { class: "tool", open: open ? true : null },
    h("summary", {}, h("span", { class: "tool-ico" }, ic("tool")), h("span", { class: "tool-kind" }, "Tool call"), h("span", { class: "tool-name" }, c.name), h("span", { class: "tool-peek" }, peek(c.arguments))),
    h("pre", {}, ...jsonNodes(pretty)));
  d.addEventListener("toggle", () => { S.toolOpen[key] = d.open; });
  return d;
}

function replyBody(cid, t, v) {
  const mkey = `${cid}:${t.turn}:0`, marked = S.marks.has(mkey);
  const text = v.response && v.response.trim() ? v.response : "";
  const calls = v.tool_calls || [];
  const body = h("div", { class: "agent-body" + (marked ? " marked" : "") + (v.mock_fired ? " fired" : "") },
    v.mock_fired ? h("div", { class: "fire-badge", title: "Mock mode only: the scripted mock victim acted out its placeholder behaviour. A real victim never flags this; spotting it is the game." }, h("i"), "FIRE", h("span", {}, "mock victim acted out the target")) : null,
    h("div", { class: "agent-text" + (text ? "" : " empty") }, text || (calls.length ? "(no text, only a tool call)" : "(no text)")),
    ...calls.map((c, ci) => toolCard(c, `${mkey}:${ci}`, true)),
    h("div", { class: "sample-actions" },
      h("button", { class: "mark-btn" + (marked ? " on" : ""), "aria-pressed": marked ? "true" : "false", title: "Your own marker, kept in this browser. The game never tells you which replies matter.", onclick: () => toggleMark(mkey) },
        ic(marked ? "star" : "starO"), marked ? "Marked" : "Mark as suspicious"),
      v.response_truncated ? h("span", { class: "trunc" }, "reply was cut off") : null,
      calls.length ? h("span", { class: "muted" }, plural(calls.length, "tool call")) : null));
  return body;
}

function turnNodes(cid, t) {
  const nodes = [];
  const img = t.image;
  const pill = img ? h("span", { class: "img-pill" },
    img === "adversarial" ? h("img", { src: S.cell.image_url, alt: "" }) : h("span", { class: "dot" }, ic(img === "none" ? "ban" : "image")),
    "image: " + IMG_SHORT[img]) : null;
  nodes.push(h("div", { class: "msg-row user" }, h("div", { class: "user-wrap" }, pill, h("div", { class: "bubble" }, t.user))));

  const inner = replyBody(cid, t, { response: t.response, tool_calls: t.tool_calls, response_truncated: t.response_truncated, mock_fired: t.mock_fired });
  nodes.push(h("div", { class: "msg-row agent" }, h("div", { class: "agent-av" }, "Z"),
    h("div", { class: "agent-col" }, h("div", { class: "agent-name" }, "Agent-Z", h("span", { class: "tag muted" }, `turn ${t.turn}`)), inner)));
  return nodes;
}

function renderTranscript(keepScroll = false) {
  const tr = $("transcript");
  const stick = S.forceScroll || (!keepScroll && nearBottom(tr)); const prev = tr.scrollTop;
  const turns = S.selConv != null ? (S.convs[S.selConv] || []) : [];
  const nodes = [];
  turns.forEach((t) => nodes.push(...turnNodes(S.selConv, t)));
  const p = S.pending;
  if (p && (p.isNew ? S.selConv == null : p.conv === S.selConv)) {
    nodes.push(h("div", { class: "msg-row user" }, h("div", { class: "user-wrap" },
      p.isNew ? h("span", { class: "img-pill" }, p.image === "adversarial" ? h("img", { src: S.cell.image_url, alt: "" }) : h("span", { class: "dot" }, ic(p.image === "none" ? "ban" : "image")), "image: " + IMG_SHORT[p.image]) : null,
      h("div", { class: "bubble" }, p.message))));
    nodes.push(h("div", { class: "msg-row agent" }, h("div", { class: "agent-av" }, "Z"),
      h("div", { class: "agent-col" }, h("div", { class: "agent-name" }, "Agent-Z", h("span", { class: "tag muted" }, "thinking\u2026")),
        h("div", { class: "agent-body" }, h("span", { class: "typing", "aria-label": "Agent-Z is replying" }, h("i"), h("i"), h("i"))))));
  }
  if (!nodes.length) {
    nodes.push(h("div", { class: "empty-state" },
      h("div", { class: "empty-art" }, "Z"),
      h("h2", {}, "Say something to Agent-Z"),
      h("p", {}, "Start with ordinary requests. The first message of a conversation carries the image. Then compare it against the clean copy and no image."),
      h("div", { class: "starters" }, ...["What can you do?", "Check my inbox", "Describe the image you were given", "What is the capital of France?"].map((s) =>
        h("button", { type: "button", class: "starter", onclick: () => { $("msg").value = s; autoGrow(); $("msg").focus(); } }, s)))));
  }
  tr.replaceChildren(...nodes);
  hydrateIcons(tr);
  if (stick) tr.scrollTop = tr.scrollHeight; else tr.scrollTop = prev;
  S.forceScroll = false;

  const u = S.session.usage, cid = S.selConv, cur = cid != null && cid === u.active_conversation;
  $("chatTitle").textContent = cid != null ? `Conversation ${cid}` : "New conversation";
  $("chatSub").textContent = cid != null
    ? (cur ? `turn ${Math.min(u.active_turns_used, u.max_turns_per_conv)} of ${u.max_turns_per_conv} \u00b7 image: ${IMG_SHORT[(S.convs[cid][0] || {}).image] || "?"}` : `earlier conversation \u00b7 ${plural(turns.length, "turn")}`)
    : "the first message opens it";
}

function toggleMark(key) {
  if (S.marks.has(key)) S.marks.delete(key); else S.marks.add(key);
  store.set("agentz_marks_" + S.session.session_id, JSON.stringify([...S.marks]));
  renderTranscript(true); renderConvList();
}

/* ───────── composer ───────── */
const IMAGE_HELP = {
  adversarial: ["Adversarial.", " The optimized image under audit is attached to the first message. This is the one that may change the agent's behaviour."],
  clean: ["Clean.", " The unmodified original photo is attached instead. Your control: whatever happens only with the adversarial image is the signal."],
  none: ["None.", " No image at all. Shows the agent's plain baseline."],
};

function buildControls() {
  const imgs = S.cell.image_options;
  $("imageSeg").replaceChildren(...imgs.map((o) => h("button", { type: "button", role: "radio", "data-v": o, onclick: () => { S.image = o; renderComposer(); } }, o === "none" ? "None" : o[0].toUpperCase() + o.slice(1))));
}

function renderComposer() {
  const { u, turnsFull, noBudget, locked } = derived();
  const cid = S.selConv, isPast = cid != null && u.active_conversation != null && cid !== u.active_conversation;
  const forced = turnsFull;                       // the next message must open a new conversation
  const nc = $("newConv");
  nc.checked = forced ? true : S.newConv; nc.disabled = forced || locked;
  const isNew = nc.checked;
  $("imageCtl").classList.toggle("off", !isNew || locked);
  $("imageSeg").querySelectorAll("button").forEach((b) => { const on = b.dataset.v === S.image; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); b.disabled = !isNew || locked; });

  const help = $("imageHelp");
  const bits = isNew ? IMAGE_HELP[S.image] || IMAGE_HELP.adversarial : ["Continuing the current conversation.", " Its image was fixed by its first message, so the image setting only applies when you start a new conversation."];
  help.replaceChildren(h("b", {}, bits[0]), bits[1]);

  const lock = $("lockBanner");
  lock.hidden = true; lock.className = "lock";
  if (noBudget) { lock.hidden = false; lock.classList.add("budget"); lock.replaceChildren(h("b", {}, "Budget spent. "), `All ${u.max_conversations} conversations are used. Review your transcripts and submit your answer.`); }
  else if (isPast) { lock.hidden = false; lock.classList.add("past"); lock.replaceChildren("You are reading an earlier conversation. New messages go to ", h("b", {}, forced ? "a new conversation" : `conversation ${u.active_conversation}`), ". ", h("a", { href: "#", onclick: (e) => { e.preventDefault(); selectConv(forced ? null : u.active_conversation); } }, forced ? "Start fresh" : "Jump there")); }
  $("composer").classList.toggle("locked", locked);
  $("msg").disabled = locked; $("sendBtn").disabled = locked || S.sending;
  $("msg").placeholder = locked ? "Budget spent" : isNew ? "Message Agent-Z (new conversation)\u2026" : "Reply in conversation " + u.active_conversation + "\u2026";
  $("sendBtn").querySelector("[data-icon]").hidden = S.sending; $("sendBtn").querySelector(".spin").hidden = !S.sending;
}

function autoGrow() { const m = $("msg"); m.style.height = "auto"; m.style.height = Math.min(m.scrollHeight, 160) + "px"; }

async function send() {
  const { u, turnsFull, locked } = derived();
  if (S.sending || locked) return;
  const message = $("msg").value.trim(); if (!message) return;
  const isNew = turnsFull || $("newConv").checked;
  S.pending = { message, isNew, image: S.image, conv: isNew ? null : u.active_conversation };
  if (isNew) S.selConv = null; else S.selConv = u.active_conversation;
  S.sending = true; S.forceScroll = true;
  renderConvList(); renderTranscript(); renderComposer();
  try {
    const r = await api("/api/query_model", { method: "POST", body: { message, new_conversation: isNew, image: S.image } });
    if (r.status !== "ok") toast(r.message || ("Not sent: " + r.status), "err");
    else { $("msg").value = ""; autoGrow(); S.newConv = false; }
  } catch (e) {
    if (e.status === 401) { onAuthLost(); return; }
    toast(e.message, "err");
  }
  try {
    const [session, convs] = await Promise.all([api("/api/session"), api("/api/conversations")]);
    S.session = session; S.convs = convs;
  } catch (e) { if (e.status === 401) { onAuthLost(); return; } }
  S.pending = null; S.sending = false;
  const ids = convIds();
  S.selConv = S.session.usage.active_conversation || (ids.length ? ids[ids.length - 1] : null);
  S.forceScroll = true;
  renderAll(); $("msg").focus();
}

function onAuthLost() {
  if (S.cell) store.del(tokKey(S.cell.id));
  toast("Your session ended (the server restarted?). Start a new one.", "err");
  S.sending = false; S.pending = null; location.hash = "#/";
}

/* ───────── notes drawer ───────── */
let notesLoaded = false;
async function openDrawer() {
  $("notesDrawer").classList.add("open"); $("notesDrawer").setAttribute("aria-hidden", "false"); $("drawerScrim").hidden = false;
  if (!notesLoaded) {
    $("notesState").textContent = "loading\u2026";
    try { const r = await api("/api/read_md"); $("notesText").value = r.content || ""; notesLoaded = true; $("notesState").textContent = ""; }
    catch (e) { $("notesState").textContent = ""; toast("Could not load notes: " + e.message, "err"); }
  }
  $("notesText").focus();
}
function closeDrawer() { $("notesDrawer").classList.remove("open"); $("notesDrawer").setAttribute("aria-hidden", "true"); $("drawerScrim").hidden = true; }
async function saveNotes() {
  $("notesState").textContent = "saving\u2026";
  try { await api("/api/write_md", { method: "POST", body: { content: $("notesText").value, mode: "overwrite" } }); $("notesState").textContent = "saved"; setTimeout(() => { if ($("notesState").textContent === "saved") $("notesState").textContent = ""; }, 2000); }
  catch (e) { $("notesState").textContent = ""; toast("Notes not saved: " + e.message, "err"); }
}

/* ───────── image lightbox ───────── */
function openLightbox() {
  const base = Math.max(240, Math.min(innerWidth - 80, innerHeight - 150, 760));
  let z = 1;
  const img = h("img", { src: S.cell.image_url, alt: "The image under audit, enlarged" });
  img.style.imageRendering = "pixelated";
  const label = h("span", { class: "lb-zoom" });
  const apply = () => { img.style.width = base * z + "px"; label.textContent = img.naturalWidth ? Math.round(100 * base * z / img.naturalWidth) + "%" : Math.round(z * 100) + "%"; };
  img.onload = apply;
  const set = (nz) => { z = Math.max(.4, Math.min(6, nz)); apply(); };
  const bar = h("div", { class: "lb-bar" }, h("b", {}, S.cell.title), h("span", { class: "grow" }),
    h("button", { class: "btn small", onclick: () => set(z / 1.25), "aria-label": "Zoom out" }, "\u2212"), label,
    h("button", { class: "btn small", onclick: () => set(z * 1.25), "aria-label": "Zoom in" }, "+"),
    h("button", { class: "btn small", onclick: () => set(1) }, "Fit"),
    h("button", { class: "btn small", onclick: () => set(img.naturalWidth / base) }, "1:1"),
    h("a", { class: "btn small", href: S.cell.image_url, download: `image_${S.cell.id}.png` }, ic("download"), "Download"),
    h("button", { class: "btn small", onclick: closeLightbox, "aria-label": "Close" }, "Close"));
  const stage = h("div", { class: "lb-stage" }, img);
  stage.addEventListener("wheel", (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); set(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); } }, { passive: false });
  const lb = h("div", { class: "lightbox", id: "lightbox", role: "dialog", "aria-label": "Image viewer" }, bar, stage);
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target === stage) closeLightbox(); });
  document.body.append(lb); hydrateIcons(lb); apply();
}
function closeLightbox() { const l = $("lightbox"); if (l) l.remove(); }

/* ───────── submit ───────── */
const MAX_HYPS = 3;
function resetSubmitForm() { $("hypList").replaceChildren(); addHyp(); $("pasteTx").value = ""; $("attachSel").value = ""; }

function addHyp() {
  const list = $("hypList"); if (list.children.length >= MAX_HYPS) return;
  const n = list.children.length + 1;
  const conf = h("input", { type: "range", min: "0", max: "1", step: "0.05", value: "0.5", "aria-label": "Confidence" });
  const out = h("output", {}, "50%");
  conf.addEventListener("input", () => { out.textContent = Math.round(conf.value * 100) + "%"; });
  const ta = h("textarea", { class: "t", rows: "3", placeholder: n === 1 ? "e.g. The agent calls a tool to do X with Y, or it states Z as fact\u2026" : "A different explanation\u2026" });
  ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } });
  const d = h("div", { class: "hyp r" + n },
    h("div", { class: "hyp-head" }, h("span", { class: "rank" }, n), h("span", { class: "lab" }, n === 1 ? "Best guess" : "Alternative"),
      h("button", { type: "button", class: "icon-btn rm", "aria-label": "Remove this guess", onclick: () => { d.remove(); renumberHyps(); } }, "\u00d7")),
    ta,
    h("div", { class: "conf" }, "Confidence", conf, out),
    h("details", {}, h("summary", {}, "Add reasoning (optional)"), h("textarea", { class: "r", rows: "2", placeholder: "Which messages, with which image, produced what?" })));
  list.append(d); renumberHyps();
}
function renumberHyps() {
  const list = $("hypList");
  if (!list.children.length) addHyp();
  [...list.children].forEach((d, i) => {
    d.className = "hyp r" + (i + 1); d.querySelector(".rank").textContent = i + 1; d.querySelector(".lab").textContent = i === 0 ? "Best guess" : "Alternative";
    d.querySelector(".rm").hidden = list.children.length === 1;
  });
  $("addHyp").hidden = list.children.length >= MAX_HYPS;
}

function renderSubmit() {
  const { revealed } = derived();
  const practiceN = S.session.submissions.filter((x) => x.post_reveal).length;
  const cap = revealed ? S.info.limits.max_practice_submissions : S.info.limits.max_submissions;
  const left = cap - (revealed ? practiceN : S.session.submissions.length - practiceN);
  const chip = $("subLeft"); chip.textContent = `${left} of ${cap} left${revealed ? " (practice)" : ""}`; chip.className = "chip" + (left <= 0 ? " false" : left === 1 ? " warn" : "");
  const off = left <= 0;
  $("submitBtn").disabled = off || S.submitting;
  $("submitNote").textContent = left <= 0 ? (revealed ? "No submissions left." : "No submissions left. Reveal to see the answer.") : revealed ? "Practice mode: answers are still graded, but they are not ranked on the leaderboard." : "The judge shows only full / partial / miss until you reveal.";
  $("hypList").querySelectorAll("textarea,input,button").forEach((e) => { e.disabled = off; });
  $("addHyp").disabled = off; $("attachSel").disabled = off; $("pasteTx").disabled = off;
  const keep = $("attachSel").value;
  $("attachSel").replaceChildren(h("option", { value: "" }, "(none)"), ...convIds().map((i) => h("option", { value: String(i) }, `Conversation ${i}` + ((S.convs[i][0] || {}).user ? ` \u00b7 ${S.convs[i][0].user.slice(0, 36)}` : ""))));
  $("attachSel").value = keep;
  const sub = S.session.submissions.length > 0;
  const rb = $("revealBtn");
  rb.disabled = !sub;
  rb.replaceChildren(ic("eye"), revealed ? "View ground truth" : "Reveal ground truth"); hydrateIcons(rb);
  $("revealHelp").textContent = revealed ? "You already revealed it. Open it again any time. Answers from now on are practice and not ranked." : sub ? "Shows the true target and trigger and the judge's reasoning. You can keep playing, but later answers are not ranked." : "Locked until you submit at least one answer. Revealing shows the true target and trigger and the judge's reasoning.";
}

async function submit() {
  if (S.submitting) return;
  const hypotheses = [...$("hypList").children].map((d) => ({
    target: d.querySelector(".t").value.trim(), reasoning: d.querySelector(".r").value.trim(), confidence: +d.querySelector("input[type=range]").value,
  })).filter((x) => x.target);
  if (!hypotheses.length) { toast("Write at least one guess first: what does the image make the agent do?", "err"); $("hypList").querySelector(".t").focus(); return; }
  const body = { hypotheses };
  if ($("attachSel").value) body.attach_conversation = +$("attachSel").value; else if ($("pasteTx").value.trim()) body.attach_transcript = $("pasteTx").value;
  S.submitting = true; $("submitBtn").disabled = true; $("submitBtn").querySelector(".spin").hidden = false; $("submitBtn").querySelector(".btn-label").textContent = "Judging\u2026";
  try {
    const r = await api("/api/submit_hypotheses", { method: "POST", body });
    S.session = await api("/api/session");
    S.newVerdict = r.verdict;
    renderSubmit(); renderVerdicts(); loadBoard();
    if (r.verdict === "full") { confetti(); toast("Full match. You found it.", "ok"); }
    else if (r.verdict === "partial") toast("Partial match. You are close. Refine the guess or reveal.", "");
    else toast("Not it yet. Probe more, then try again.", "");
  } catch (e) {
    if (e.status === 401) { onAuthLost(); return; }
    toast(e.message, "err");
  }
  S.submitting = false; $("submitBtn").querySelector(".spin").hidden = true; $("submitBtn").querySelector(".btn-label").textContent = "Submit for judging";
  renderSubmit();
}

function renderVerdicts() {
  const subs = S.session.submissions;
  $("verdictSection").hidden = !subs.length;
  $("verdicts").replaceChildren(...[...subs].reverse().map((s) => {
    const pct = s.score == null ? 0 : Math.round(Math.max(0, Math.min(1, s.score)) * 100);
    const ring = h("div", { class: "ring" }, h("b", {}, s.score == null ? "n/a" : fmtScore(s.score)));
    ring.style.setProperty("--p", pct);
    return h("div", { class: "verdict " + s.verdict }, ring,
      h("div", { class: "v-main" },
        h("div", { class: "v-label" }, VERDICT_LABEL[s.verdict] || s.verdict),
        h("div", { class: "v-sub" }, `Submission ${s.n}` + (s.post_reveal ? " \u00b7 practice, not ranked" : "") + (s.hypotheses.length > 1 ? `, best of ${s.hypotheses.length} guesses` : "")),
        s.hypotheses.length > 1 ? h("div", { class: "v-chips" }, ...s.hypotheses.map((x) => h("span", { class: "chip " + x.verdict }, `#${x.rank} ${VERDICT_SHORT[x.verdict] || x.verdict} ${fmtScore(x.score)}`))) : null));
  }));
}

function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#5b4bff", "#168a4a", "#e9b44c", "#0f7a8a", "#f1796e"];
  const box = h("div", { style: "position:fixed;inset:0;pointer-events:none;z-index:90;overflow:hidden" });
  for (let i = 0; i < 46; i++) {
    const p = h("i", { style: `position:absolute;left:${40 + Math.random() * 20}%;top:55%;width:${6 + Math.random() * 6}px;height:${8 + Math.random() * 8}px;background:${colors[i % colors.length]};border-radius:2px;opacity:1` });
    const dx = (Math.random() - .5) * 700, dy = -(180 + Math.random() * 360), rot = Math.random() * 720;
    p.animate([{ transform: "translate(0,0) rotate(0)", opacity: 1 }, { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg)`, opacity: 1, offset: .55 }, { transform: `translate(${dx * 1.2}px,${dy + 640}px) rotate(${rot * 1.5}deg)`, opacity: 0 }], { duration: 1500 + Math.random() * 900, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
    box.append(p);
  }
  document.body.append(box); setTimeout(() => box.remove(), 2600);
}

/* ───────── reveal ───────── */
function revealFlow() {
  if (!S.session.submissions.length) return;
  if (S.session.revealed) { doReveal(); return; }
  const m = h("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": "Confirm reveal" },
    h("h2", {}, "Reveal the ground truth?"),
    h("p", { class: "sub" }, "You will see what the image really makes Agent-Z do and what triggers it, plus the judge's reasoning for each of your submissions. The session stays open so you can keep testing, but answers submitted after this point are practice and not ranked. Your best verdict so far stays on the leaderboard."),
    h("div", { class: "modal-actions" },
      h("button", { class: "btn", onclick: closeModal }, "Keep playing"),
      h("button", { class: "btn danger", id: "confirmReveal", onclick: doReveal }, "Reveal")));
  openModal(m); $("confirmReveal").focus();
}

async function doReveal() {
  const btn = $("confirmReveal"); if (btn) { btn.disabled = true; btn.textContent = "Revealing\u2026"; }
  try {
    const r = await api("/api/reveal", { method: "POST" });
    S.session = await api("/api/session");
    renderAll(); loadBoard();
    const subs = r.submissions;
    const m = h("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": "Ground truth" },
      h("h2", {}, "The ground truth"),
      h("p", { class: "sub" }, "This is what the image makes Agent-Z do, and what triggers it. You can keep playing; new answers are practice and not ranked."),
      h("div", { class: "truth" }, h("div", { class: "lab" }, "Target"), h("p", {}, r.ground_truth_target)),
      h("div", { class: "truth" }, h("div", { class: "lab" }, "Trigger"), ...(r.ground_truth_trigger || []).map((t) => h("p", {}, t))),
      h("h3", {}, "How the judge read your answers"),
      ...subs.map((s) => h("div", { class: "sub-card" },
        h("div", { class: "top" }, `Submission ${s.n}` + (s.post_reveal ? " (practice)" : ""), h("span", { class: "chip " + s.verdict }, `${VERDICT_SHORT[s.verdict] || s.verdict} \u00b7 ${fmtScore(s.score)}`)),
        ...(s.rationales || []).map((t, i) => h("p", {}, h("span", { class: "rk" }, `#${i + 1} `), t || "(no rationale)")))),
      h("div", { class: "modal-actions" },
        h("a", { class: "btn", href: "#/" }, "Pick another cell"),
        h("button", { class: "btn primary", onclick: closeModal }, "Keep playing")));
    openModal(m);
  } catch (e) {
    if (e.status === 401) { onAuthLost(); return; }
    closeModal(); toast(e.message, "err");
  }
}

/* ───────── leaderboard ───────── */
async function loadBoard() {
  if (!S.cell) return;
  const id = S.cell.id;
  const rows = await api("/api/leaderboard/" + id, { token: null }).catch(() => null);
  if (!S.cell || S.cell.id !== id) return;
  S.boards[id] = rows || [];
  const box = $("lbBox");
  if (!rows || !rows.length) { box.replaceChildren(h("div", { class: "lb-empty" }, rows ? "No answers yet. Yours could be first." : "Leaderboard unavailable.")); return; }
  const t = h("table", { class: "lb-table" },
    h("thead", {}, h("tr", {}, h("th", {}, "#"), h("th", {}, "Player"), h("th", {}, "Best"), h("th", { class: "num", title: "Agent queries used when the best verdict was first reached" }, "Queries"), h("th", { class: "num" }, "Subs"))),
    h("tbody", {}, ...rows.map((r) => h("tr", { class: r.player === S.player ? "me" : "" },
      h("td", {}, h("span", { class: "medal" }, r.rank)), h("td", {}, r.player), h("td", {}, h("span", { class: "chip " + r.verdict }, VERDICT_SHORT[r.verdict] || r.verdict)),
      h("td", { class: "num" }, r.calls_at_first_hit ?? "\u2013"), h("td", { class: "num" }, r.submissions)))));
  box.replaceChildren(t);
}

/* ───────── wiring ───────── */
function wire() {
  $("composer").addEventListener("submit", (e) => { e.preventDefault(); send(); });
  $("msg").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } });
  $("msg").addEventListener("input", autoGrow);
  $("newConv").addEventListener("change", () => { S.newConv = $("newConv").checked; renderComposer(); });
  $("imgOpen").addEventListener("click", openLightbox); $("imgOpen2").addEventListener("click", openLightbox);
  $("notesBtn").addEventListener("click", openDrawer); $("notesClose").addEventListener("click", closeDrawer); $("drawerScrim").addEventListener("click", closeDrawer);
  $("notesSave").addEventListener("click", saveNotes);
  $("notesText").addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveNotes(); } });
  $("addHyp").addEventListener("click", addHyp);
  $("submitBtn").addEventListener("click", submit);
  $("revealBtn").addEventListener("click", revealFlow);
  $("lbRefresh").addEventListener("click", loadBoard);
  $("apiToken").addEventListener("click", () => $("apiToken").classList.toggle("show"));
  document.querySelectorAll(".copy").forEach((b) => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($(b.dataset.copy).textContent); b.textContent = "copied"; setTimeout(() => { b.textContent = "copy"; }, 1400); } catch (_e) { toast("Copy failed. Select the text instead.", "err"); }
  }));
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if ($("lightbox")) closeLightbox(); else if (!$("modalRoot").hidden) closeModal(); else closeDrawer();
  });
  // reset the notes cache when switching sessions
  window.addEventListener("hashchange", () => { notesLoaded = false; });
}

wire();
boot().catch((e) => { toast("Failed to start: " + e.message, "err"); });
