// Right panel for the focused agent: context split, activity log, prompt cache.
// One renderer per `role`; all read the halo.* labels of the focused terminal.

import { div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { MONO, CATS, label, focusedAgent, cacheTtl, hud, segbar, tok, ago, dur, clean } from "./lib.js";

const KIND = {
  read: ["READ", "ansi4"], edit: ["EDIT", "ansi3"], run: ["RUN", "ansi2"], search: ["FIND", "ansi6"],
  agent: ["AGENT", "ansi5"], skill: ["SKILL", "ansi3"], mcp: ["MCP", "ansi5"], tool: ["TOOL", "ansi8"],
  error: ["ERR", "blocked"], reply: ["REPLY", "muted"],
};

const mono = (size, color, text) => div().font_family(MONO).text_size(size).text_color(color).child(text);

function empty(t, title, text) {
  return v_flex().size_full().p(12).gap(10).child(hud(t, title)).child(mono(10, t.dim, text));
}

export function renderContext(t) {
  const term = focusedAgent();
  const ctx = label(term, "halo.context");
  const status = label(term, "halo.status");
  if (!ctx && !status) return empty(t, "CONTEXT", "AWAITING FIRST TURN…");

  const used = status?.used || ctx?.used || 0;
  const win = status?.win || 200000;
  const pct = status?.ctx ?? Math.round((used / win) * 100);
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
  return v_flex().id("ctx").size_full().p(12).gap(10).overflow_y_scrollbar()
    .child(hud(t, "CONTEXT", status?.model ?? ctx?.model ?? null))
    .child(h_flex().items_end().gap(8)
      .child(mono(28, pct >= 80 ? t.blocked : pct >= 60 ? t.ansi3 : t.accent, `${pct}%`))
      .child(v_flex().pb(5).child(mono(10, t.muted, `${tok(used)} / ${tok(win)}`)).child(mono(9, t.dim, `FREE ${tok(Math.max(0, win - used))}`))))
    .child(segbar(t, parts, 40, 8))
    .child(v_flex().gap(7).children(CATS.map(row).filter(Boolean)))
    .child(h_flex().gap(8).pt(2)
      .child(mono(9, t.dim, "≈ SPLIT ESTIMATED · TOTAL EXACT"))
      .child(div().flex_1())
      .when(Boolean(lastCompact), (el) => el.child(mono(9, t.dim,
        `COMPACT ×${compacts.length} · ${tok(lastCompact.pre)} ${ago(lastCompact.at)} AGO`))));
}

export function renderActivity(t) {
  const term = focusedAgent();
  const entries = label(term, "halo.activity") ?? [];
  const now = term?.status === "working" ? clean(term?.report?.msg) : null;
  if (!entries.length && !now) return empty(t, "ACTIVITY", "NO EVENTS YET");

  const line = (e, i) => {
    if (e.k === "prompt") {
      return v_flex().id(`act-${i}`).pt(6).pb(2).gap(3)
        .child(h_flex().gap(6).items_center()
          .child(mono(9, t.accent, "▸ PROMPT")).child(div().flex_1().h(1).bg(t.accent).opacity(0.15)).child(mono(9, t.dim, ago(e.at))))
        .child(div().text_size(11).text_color(t.foreground).truncate().child(e.d ?? ""));
    }
    const [tag, color] = KIND[e.k] ?? KIND.tool;
    return h_flex().id(`act-${i}`).gap(8).items_center().h(20)
      .child(div().w(30).flex_none().child(mono(9, t.dim, ago(e.at))))
      .child(div().w(38).flex_none().child(mono(9, t[color] ?? t.muted, tag)))
      .child(div().flex_1().min_w(0).truncate().text_size(11).text_color(e.k === "reply" ? t.dim : t.muted)
        .child(e.d || e.n || ""));
  };

  return v_flex().id("act").size_full().p(12).gap(4).overflow_y_scrollbar()
    .child(hud(t, "ACTIVITY", `${entries.length} EVT`))
    .when(Boolean(now), (el) => el.child(h_flex().gap(8).items_center().h(22).px(6).rounded(4).bg(t.selected)
      .child(div().font_family(MONO).text_size(10).text_color(t.working).frames(["◐", "◓", "◑", "◒"], 160))
      .child(div().flex_1().min_w(0).truncate().text_size(11).text_color(t.foreground).child(now))))
    .children([...entries].reverse().map(line));
}

export function renderCache(t) {
  const term = focusedAgent();
  const status = label(term, "halo.status");
  const cache = label(term, "halo.cache");
  if (!status && !cache) return empty(t, "CACHE", "NO CACHE DATA");

  const ttl = cacheTtl(status, t);
  const ttlSec = status?.ttl === "5m" ? 300 : cache?.ttl ?? 3600;
  const hit = status?.hit != null ? Math.round(status.hit * 100) : null;
  const misses = (cache?.misses ?? []).slice(-3).reverse();
  const stat = (name, value) => v_flex().flex_1().gap(1).child(mono(8.5, t.dim, name)).child(mono(11, t.foreground, value));

  return v_flex().size_full().p(12).gap(8)
    .child(hud(t, "CACHE", status?.ttl ? `TTL ${status.ttl.toUpperCase()}` : null))
    .child(h_flex().items_center().gap(10)
      .child(mono(20, ttl?.color ?? t.dim, ttl ? (ttl.left > 0 ? ttl.text : "COLD") : "—"))
      .child(v_flex().flex_1().gap(4)
        .child(segbar(t, [[ttl && ttl.left > 0 ? ttl.left / 1000 / ttlSec : 0, ttl?.color ?? t.dim]], 24, 5))
        .child(mono(9, t.dim, ttl && ttl.left > 0 ? `EXPIRES IN ${dur(ttl.left)} · REBUILD ${tok(status?.cold)}` : `REBUILD COST ${tok(status?.cold)}`))))
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
}
