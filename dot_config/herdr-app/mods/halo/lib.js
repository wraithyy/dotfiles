// Shared helpers for the halo views: label parsing, agent lookup, formatting and the
// HUD primitives (section header, corner brackets, segmented bar).

import { div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { terminals, agents, focused, shared, setShared } from "herdr";

// UI state shared by every halo copy (tab bar chips, dock, tree) and kept by Herdr
// across restarts (shared.json).
const DEFAULT_PREFS = { panel: true, agents: true, columns: "auto", groups: { agent: true, git: true, dev: true } };

export function prefs() {
  const p = shared("halo.prefs");
  return p && typeof p === "object" ? { ...DEFAULT_PREFS, ...p, groups: { ...DEFAULT_PREFS.groups, ...p.groups } } : DEFAULT_PREFS;
}

export function setPrefs(patch) {
  setShared("halo.prefs", { ...prefs(), ...patch });
}

export function folded(id, byDefault = false) {
  const f = shared("halo.fold");
  return f && typeof f === "object" && id in f ? Boolean(f[id]) : byDefault;
}

export function toggleFold(id, byDefault = false) {
  const f = shared("halo.fold");
  setShared("halo.fold", { ...(f && typeof f === "object" ? f : {}), [id]: !folded(id, byDefault) });
}

const chevron = (t, isFolded, size = 10) =>
  svg(`mods/workspace-chrome/chevron-${isFolded ? "right" : "down"}.svg`).size(size).text_color(t.dim);

// A themed group (AGENT / GIT / DEV) or a section inside one. The header toggles the
// fold; folded, it still shows the summary so the line stays informative.
export function section(t, id, title, info, { group = false, byDefault = false } = {}) {
  if (!info) return null;
  // A one-line section (info.onOpen) has no body: its header opens something instead.
  const isFolded = info.onOpen ? true : folded(id, byDefault);
  const summary = info.summary
    ? div().max_w(220).min_w(0).truncate().font_family(MONO).text_size(9.5).text_color(info.summaryColor ?? t.dim).child(info.summary)
    : null;
  const header = h_flex().id(`fold-${id}`).h(group ? 26 : 22).gap(7).items_center().cursor_pointer().rounded(4)
    .hover((s) => s.bg(t.hover))
    .on_click(() => (info.onOpen ? info.onOpen() : toggleFold(id, byDefault)))
    .when(Boolean(info.onOpen), (el) => el.tooltip(info.tooltip ?? ""))
    .child(div().flex_none().child(chevron(t, isFolded, group ? 11 : 9)))
    .when(group, (el) => el.child(div().w(2).h(11).bg(t.accent)))
    .child(div().flex_none().font_family(MONO).text_size(group ? 10.5 : 9.5).font_semibold()
      .text_color(group ? t.accent : t.muted).child(title))
    .child(div().flex_1().min_w(12).h(1).bg(group ? t.accent : t.border).opacity(group ? 0.2 : 0.8))
    .when(Boolean(summary), (el) => el.child(summary));
  return v_flex().gap(group ? 8 : 6)
    .child(header)
    .when(!isFolded && Boolean(info.body), (el) => el.child(div().pl(group ? 0 : 16).child(info.body)));
}

export const MONO = "JetBrainsMono Nerd Font Mono";
export const WARN_MS = 10 * 60 * 1000;
export const CRIT_MS = 5 * 60 * 1000;

export const STATUS_LABEL = { blocked: "WAITING", done: "DONE", working: "ACTIVE", idle: "IDLE" };

// Category colors come from the terminal palette so they follow the theme.
export const CATS = [
  ["messages", "Messages", "ansi4"],
  ["tools", "Tools", "ansi6"],
  ["mcp", "MCP", "ansi5"],
  ["skills", "Skills", "ansi3"],
  ["agents", "Subagents", "ansi2"],
  ["memory", "Memory & hooks", "ansi1"],
  ["system", "System", "ansi8"],
];

// Labels are JSON written by halo-reporter; terminals() re-renders when they change.
const parsed = new Map();
export function label(terminal, key) {
  const raw = terminal?.labels?.[key];
  if (!raw) return null;
  const hit = parsed.get(raw);
  if (hit !== undefined) return hit;
  let value = null;
  try { value = JSON.parse(raw); } catch { value = null; }
  if (parsed.size > 64) parsed.clear();
  parsed.set(raw, value);
  return value;
}

export const terminalOf = (address) => terminals().find((t) => t.address === address);

// The terminal on screen with the keyboard, if it runs an agent; same rule the panel
// visibility uses, so the panel and its content never disagree.
export function focusedAgent() {
  const f = focused();
  const address = f?.shown ?? f?.terminal ?? f?.agent;
  if (!address) return null;
  const t = terminalOf(address);
  if (!t || t.state !== "live") return null;
  return t.program?.agent || t.report || agents().some((a) => a.address === address) ? t : null;
}

export const clean = (s) => (s ?? "").replace(/^[^\p{L}\p{N}\p{Ps}\p{Pi}]+/u, "").trim();

export function task(agent, terminal) {
  const msg = terminal?.report?.msg;
  return clean(msg) || clean(agent.title) || agent.program?.name || agent.address;
}

export function dur(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m >= 1440) return `${Math.floor(m / 1440)}d${Math.floor((m % 1440) / 60)}h`;
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : `${m}m`;
}

export function ago(sec) {
  if (!sec) return "";
  const s = Math.max(0, Date.now() / 1000 - sec);
  return s < 60 ? `${Math.round(s)}s` : dur(s * 1000);
}

export function tok(n) {
  if (n == null) return "–";
  return n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k` : String(Math.round(n));
}

// Cache state from the statusline label: {left ms, color, text}. Null when there is
// no cache to speak of (not Claude, or no request yet).
export function cacheTtl(status, t) {
  if (!status?.exp) return null;
  const left = status.exp * 1000 - Date.now();
  if (left <= 0) return { left, color: t.dim, text: "COLD" };
  const color = left < CRIT_MS ? t.blocked : left < WARN_MS ? t.ansi3 : t.accent;
  return { left, color, text: dur(left) };
}

export function quotaColor(pct, t) {
  return pct >= 90 ? t.blocked : pct >= 70 ? t.ansi3 : t.accent;
}

// Newest statusline label across live Claude terminals: rate limits are per account,
// so any session's latest report is the current one.
export function latestStatus() {
  let best = null;
  for (const term of terminals()) {
    const s = label(term, "halo.status");
    if (s?.rl && (!best || s.at > best.at)) best = s;
  }
  return best;
}

// "▍CONTEXT ───────── 01" style header.
export function hud(t, title, right) {
  return h_flex().h(22).flex_none().gap(8).items_center()
    .child(div().w(2).h(10).bg(t.accent))
    .child(div().font_family(MONO).text_size(10).font_semibold().text_color(t.accent).child(title))
    .child(div().flex_1().h(1).bg(t.accent).opacity(0.18))
    .when(right != null, (el) => el.child(div().font_family(MONO).text_size(10).text_color(t.dim).child(right)));
}

// Corner brackets drawn over a panel's edges; the panel itself must be relative.
export function brackets(el, t, size = 8) {
  const c = (pos) => {
    let d = div().absolute().size(size).border_color(t.accent).opacity(0.55);
    if (pos.includes("t")) d = d.top(0).border_t(1); else d = d.bottom(0).border_b(1);
    if (pos.includes("l")) d = d.left(0).border_l(1); else d = d.right(0).border_r(1);
    return d;
  };
  return el.relative().child(c("tl")).child(c("tr")).child(c("bl")).child(c("br"));
}

// A bar of `count` cells filled by consecutive [fraction, color] parts; the rest is track.
export function segbar(t, parts, count = 32, height = 6) {
  const cells = [];
  let i = 0;
  for (const [fraction, color] of parts) {
    const n = Math.round(Math.max(0, fraction) * count);
    for (let k = 0; k < n && i < count; k++, i++) cells.push(color);
  }
  while (cells.length < count) cells.push(null);
  return h_flex().w_full().gap(2).children(cells.map((color) =>
    div().flex_1().h(height).rounded(1).bg(color ?? t.border).opacity(color ? 1 : 0.6)));
}
