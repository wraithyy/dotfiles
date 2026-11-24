// AGENT group of the dock: context split, activity log, prompt cache for the focused
// agent. Each export returns { summary, body } for a dock section, or null when the
// focused agent has no data for it yet.

import { div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { MONO, CATS, label, cacheTtl, segbar, tok, ago, dur, clean } from "./lib.js";

const KIND = {
  read: ["READ", "ansi4"], edit: ["EDIT", "ansi3"], run: ["RUN", "ansi2"], search: ["FIND", "ansi6"],
  agent: ["AGENT", "ansi5"], skill: ["SKILL", "ansi3"], mcp: ["MCP", "ansi5"], tool: ["TOOL", "ansi8"],
  error: ["ERR", "blocked"], reply: ["REPLY", "muted"],
};
const ACTIVITY_SHOWN = 16;

export const mono = (size, color, text) => div().font_family(MONO).text_size(size).text_color(color).child(text);

export function contextSection(t, term) {
  const ctx = label(term, "halo.context");
  const status = label(term, "halo.status");
  if (!ctx && !status) return { summary: "waiting", body: mono(10, t.dim, "AWAITING FIRST TURN…") };

  const used = status?.used || ctx?.used || 0;
  const win = status?.win || 200000;
  const pct = status?.ctx ?? Math.round((used / win) * 100);
  const pctColor = pct >= 80 ? t.blocked : pct >= 60 ? t.ansi3 : t.accent;
  // The split comes from the last hook run; rescale it to the live total shown above.
  const raw = ctx?.cats ?? {};
  const sum = Object.values(raw).reduce((a, b) => a + b, 0) || 1;
  const cats = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, (v / sum) * used]));
  const parts = CATS.filter(([key]) => cats[key] > 0).map(([key, , color]) => [cats[key] / win, t[color]]);

  const row = ([key, name, color]) => {
    const value = cats[key] ?? 0;
    if (!value) return null;
    const top = (ctx?.top?.[key] ?? []).slice(0, 3);
    return v_flex().gap(2)
      .child(h_flex().gap(8).items_center()
        .child(div().size(7).rounded(1).bg(t[color]))
        .child(div().flex_1().text_size(11.5).text_color(t.muted).child(name))
        .child(mono(10.5, t.foreground, tok(value)))
        .child(div().w(34).flex().justify_end().child(mono(9.5, t.dim, `${Math.round((value / (used || 1)) * 100)}%`))))
      .children(top.map(([n, v]) => h_flex().pl(15).gap(8)
        .child(div().flex_1().min_w(0).truncate().text_size(10.5).text_color(t.dim).child(n))
        .child(mono(9.5, t.dim, tok((v / sum) * used)))));
  };

  const compacts = ctx?.compacts ?? [];
  const lastCompact = compacts[compacts.length - 1];
  const body = v_flex().gap(10)
    .child(h_flex().items_end().gap(8)
      .child(mono(28, pctColor, `${pct}%`))
      .child(v_flex().pb(5).child(mono(10, t.muted, `${tok(used)} / ${tok(win)}`)).child(mono(9, t.dim, `FREE ${tok(Math.max(0, win - used))}`)))
      .child(div().flex_1())
      .child(div().pb(5).child(mono(9.5, t.dim, status?.model ?? ctx?.model ?? ""))))
    .child(segbar(t, parts, 40, 8))
    .child(v_flex().gap(7).children(CATS.map(row).filter(Boolean)))
    .child(h_flex().gap(8)
      .child(mono(9, t.dim, "≈ SPLIT ESTIMATED · TOTAL EXACT"))
      .child(div().flex_1())
      .when(Boolean(lastCompact), (el) => el.child(mono(9, t.dim,
        `COMPACT ×${compacts.length} · ${tok(lastCompact.pre)} ${ago(lastCompact.at)} AGO`))));
  return { summary: `${pct}% · ${tok(used)}`, summaryColor: pctColor, body };
}

export function activitySection(t, term) {
  const entries = label(term, "halo.activity") ?? [];
  const now = term?.status === "working" ? clean(term?.report?.msg) : null;
  if (!entries.length && !now) return { summary: "idle", body: mono(10, t.dim, "NO EVENTS YET") };

  const line = (e, i) => {
    if (e.k === "prompt") {
      return v_flex().id(`act-${i}`).pt(6).pb(2).gap(3)
        .child(h_flex().gap(6).items_center()
          .child(mono(10, t.accent, "▸ PROMPT")).child(div().flex_1().h(1).bg(t.accent).opacity(0.15)).child(mono(10, t.dim, ago(e.at))))
        .child(div().text_size(12.5).text_color(t.foreground).truncate().child(e.d ?? ""));
    }
    const [tag, color] = KIND[e.k] ?? KIND.tool;
    return h_flex().id(`act-${i}`).gap(10).items_center().h(26)
      .child(div().w(34).flex_none().child(mono(10.5, t.dim, ago(e.at))))
      .child(div().w(46).flex_none().child(mono(10.5, t[color] ?? t.muted, tag)))
      .child(div().flex_1().min_w(0).truncate().text_size(12.5).text_color(e.k === "reply" ? t.muted : t.foreground)
        .child(e.d || e.n || ""));
  };

  const recent = [...entries].reverse().slice(0, ACTIVITY_SHOWN);
  const body = v_flex().gap(4)
    .when(Boolean(now), (el) => el.child(h_flex().gap(8).items_center().h(28).px(8).rounded(5).bg(t.selected)
      .child(div().font_family(MONO).text_size(12).text_color(t.working).frames(["◐", "◓", "◑", "◒"], 160))
      .child(div().flex_1().min_w(0).truncate().text_size(12.5).text_color(t.foreground).child(now))))
    .children(recent.map(line));
  return { summary: now ? "working" : `${entries.length} evt`, summaryColor: now ? t.working : null, body };
}

export function cacheSection(t, term) {
  const status = label(term, "halo.status");
  const cache = label(term, "halo.cache");
  if (!status && !cache) return null;

  const ttl = cacheTtl(status, t);
  const ttlSec = status?.ttl === "5m" ? 300 : cache?.ttl ?? 3600;
  const hit = status?.hit != null ? Math.round(status.hit * 100) : null;
  const misses = (cache?.misses ?? []).slice(-3).reverse();
  const stat = (name, value) => v_flex().flex_1().gap(1).child(mono(8.5, t.dim, name)).child(mono(11, t.foreground, value));
  const live = ttl && ttl.left > 0;

  const body = v_flex().gap(8)
    .child(h_flex().items_center().gap(10)
      .child(mono(20, ttl?.color ?? t.dim, ttl ? (live ? ttl.text : "COLD") : "—"))
      .child(v_flex().flex_1().gap(4)
        .child(segbar(t, [[live ? ttl.left / 1000 / ttlSec : 0, ttl?.color ?? t.dim]], 24, 5))
        .child(mono(9, t.dim, live ? `EXPIRES IN ${dur(ttl.left)} · REBUILD ${tok(status?.cold)}` : `REBUILD COST ${tok(status?.cold)}`))))
    .child(h_flex().gap(8)
      .child(stat("HIT", hit != null ? `${hit}%` : "–"))
      .child(stat("READ", tok(cache?.read)))
      .child(stat("WRITTEN", tok(cache?.write)))
      .child(stat("UNCACHED", tok(cache?.uncached))))
    .children(misses.map((m) => h_flex().gap(8)
      .child(mono(9, t.blocked, "MISS"))
      .child(mono(9, t.muted, `−${tok(m.lost)}`))
      .child(div().flex_1().min_w(0).truncate().child(mono(9, t.dim, m.cause)))
      .child(mono(9, t.dim, ago(m.at)))));
  return { summary: ttl ? (live ? `TTL ${ttl.text}` : "COLD") : "–", summaryColor: ttl?.color, body };
}

// Goal / doing / waiting / next. Prefers the where-am-i Claude mod's summary (label
// halo.where); without it, falls back to what the session already reports.
function fallbackWhere(term) {
  const status = label(term, "halo.status");
  const activity = label(term, "halo.activity") ?? [];
  const lastOf = (kind) => [...activity].reverse().find((e) => e.k === kind)?.d ?? "";
  const blocked = term?.status === "blocked";
  return {
    goal: status?.name ? status.name.replace(/-/g, " ") : lastOf("prompt"),
    doing: term?.status === "working" ? clean(term?.report?.msg) : lastOf("reply"),
    waiting: blocked ? clean(term?.report?.msg) || "needs your input" : "",
    next: "",
    isFallback: true,
  };
}

export function briefSection(t, term) {
  const w = label(term, "halo.where") ?? fallbackWhere(term);
  if (!w.goal && !w.doing && !w.waiting) return null;
  const row = (icon, color, text, strong = false) => text
    ? h_flex().gap(10).items_start()
      .child(div().w(16).h(strong ? 19 : 17).flex_none().flex().items_center()
        .child(svg(`mods/halo/icons/${icon}.svg`).size(strong ? 15 : 13).text_color(color)))
      .child(div().flex_1().min_w(0).text_size(strong ? 14 : 12.5).line_height(1.35)
        .text_color(strong ? t.foreground : t.muted).when(strong, (el) => el.font_semibold()).child(text))
    : null;
  // row() is null for an empty field; gpui children must be elements, so filter them out.
  const rows = [
    row("goal", t.accent, w.goal, true),
    row("doing", t.working, w.doing),
    w.waiting
      ? h_flex().px(10).py(6).gap(10).items_start().rounded(6).bg(`${t.blocked}22`).border_l(2).border_color(t.blocked)
        .child(div().h(17).flex_none().flex().items_center()
          .child(svg("mods/halo/icons/ask.svg").size(14).text_color(t.blocked)))
        .child(div().flex_1().min_w(0).text_size(12.5).line_height(1.35).text_color(t.foreground).child(w.waiting))
      : null,
    row("next", t.accent, w.next),
    w.isFallback ? mono(9.5, t.dim, "AUTO · where-am-i summary arrives with the next session") : null,
  ].filter(Boolean);
  const body = v_flex().gap(7).children(rows);
  return { summary: w.waiting ? "waiting on you" : w.doing || w.goal, summaryColor: w.waiting ? t.blocked : null, body };
}
