// Left sidebar: spaces as tree roots, their agents beneath (task, status, context,
// cache TTL, subagents), account usage at the bottom.

import { div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { spaces, agents, terminals, run, setAgentOrder, openOverlay } from "herdr";
import { treeServersRow } from "./servers.js";
import { MONO, STATUS_LABEL, label, task, cacheTtl, latestStatus, quotaColor, dur, hud, segbar, clean, folded, toggleFold } from "./lib.js";

const RANK = { blocked: 4, done: 3, working: 2, idle: 1 };

export function dot(t, status, size = 7) {
  const color = t[status] ?? t.dim;
  const base = div().size(size).rounded(size / 2).flex_none();
  if (status === "idle") return base.border(1).border_color(t.dim);
  if (status === "working") return base.bg(color).loop("opacity", { from: 0.3, to: 1, period: 1400 });
  if (status === "blocked") return base.bg(color).loop("opacity", { from: 0.25, to: 1, period: 650 });
  return base.bg(color);
}

function subagents(terminal, all) {
  const own = Object.entries(terminal?.records ?? {})
    .filter(([, r]) => r?.state && r.state !== "done")
    .map(([id, r]) => ({ id, title: clean(r.title) || "subagent", status: r.state }));
  const spawned = all.filter((x) => x.parent === terminal?.address && x.state === "live")
    .map((x) => ({ id: x.address, title: clean(x.report?.msg) || clean(x.title) || x.address, status: x.status ?? "idle" }));
  return [...own, ...spawned];
}

function agentRow(t, a, terminal, all) {
  const status = label(terminal, "halo.status");
  const where = label(terminal, "halo.where");
  const ttl = a.app === "claude-code" ? cacheTtl(status, t) : null;
  const subs = subagents(terminal, all);
  const meta = h_flex().gap(6).font_family(MONO).text_size(9.5).min_w(0)
    .child(div().flex_none().text_color(t[a.status] ?? t.dim).child(STATUS_LABEL[a.status] ?? ""))
    .when(status?.ctx != null, (el) => el.child(div().flex_none().text_color(t.dim).child(`CTX ${status.ctx}%`)))
    .when(Boolean(ttl), (el) => el.child(div().flex_none().text_color(ttl.color)
      .child(ttl.left > 0 ? `TTL ${ttl.text}` : "TTL COLD")));

  return v_flex()
    .child(h_flex().id(`ag-${a.address}`).ml(13).pl(10).pr(8).py(5).gap(8).items_start().cursor_pointer()
      .border_l(1).border_color(a.focused ? t.accent : t.border)
      .when(a.focused, (el) => el.bg(t.selected))
      .hover((s) => s.bg(t.hover))
      .on_click(() => run("agent.focus", { terminal: a.address }))
      .child(div().pt(4).child(dot(t, a.status, 6)))
      .child(v_flex().flex_1().min_w(0).gap(2)
        .child(div().text_size(11.5).truncate().text_color(a.focused ? t.foreground : t.muted).child(where?.goal || task(a, terminal)))
        .when(Boolean(where?.waiting || where?.doing), (el) => el.child(div().text_size(10.5).truncate()
          .text_color(where.waiting ? t.blocked : t.dim).child(where.waiting ? `⏳ ${where.waiting}` : `▶ ${where.doing}`)))
        .child(meta)))
    .children(subs.map((s) => h_flex().ml(13).pl(26).pr(8).py(2).gap(6).items_center()
      .border_l(1).border_color(t.border)
      .child(div().font_family(MONO).text_size(9).text_color(t.dim).child("└"))
      .child(dot(t, s.status, 5))
      .child(div().flex_1().min_w(0).truncate().text_size(10.5).text_color(t.dim).child(s.title))));
}

function spaceRow(t, s, folded, count, onFold) {
  // The fold toggle is a sibling of the select row, not a child: nested clicks also
  // reached the row and switched space.
  const fold = div().id(`fold-${s.id}`).size(22).flex_none().rounded(5).flex().items_center().justify_center()
    .when(count > 0, (el) => el.cursor_pointer().hover((st) => st.bg(t.hover))
      .tooltip(folded ? "Show agents" : "Hide agents")
      .on_click(() => onFold()))
    .child(count > 0
      ? svg(`mods/workspace-chrome/chevron-${folded ? "right" : "down"}.svg`).size(11).text_color(t.dim)
      : div().size(3).rounded(2).bg(t.border));
  const row = h_flex().id(`sp-${s.id}`).flex_1().min_w(0).h(34).pl(4).pr(8).gap(8).items_center().rounded(6).cursor_pointer()
    .hover((st) => st.bg(t.hover))
    .on_click(() => run("space.select", { id: s.id }))
    // Herdr's own space menu (rename, new tab, close, ...), as the shipped sidebar opens it.
    .on_mouse_down("right", () => openOverlay({ mod: "menu", kind: "popup", width: 200, height: 260, props: { tab: "space", target: { id: s.id } } }))
    .child(svg("mods/workspace-chrome/folder.svg").size(14).flex_none().text_color(s.active ? t.accent : t.muted))
    .child(div().flex_1().min_w(0).truncate().text_size(13.5).font_semibold()
      .text_color(s.active ? t.foreground : t.muted).child(s.name))
    .when(Boolean(s.branch), (el) => el.child(div().flex_none().font_family(MONO).text_size(9.5).text_color(t.dim)
      .child(s.branch.length > 14 ? `${s.branch.slice(0, 13)}…` : s.branch)))
    .when(folded && count > 0, (el) => el.child(div().flex_none().font_family(MONO).text_size(9.5).text_color(t.dim).child(`${count}`)))
    .when(s.status != null, (el) => el.child(dot(t, s.status, 6)));
  return h_flex().gap(2).items_center().child(fold).child(row);
}

function usage(t) {
  const s = latestStatus();
  const row = (key, name) => {
    const q = s?.rl?.[key];
    if (typeof q?.used_percentage !== "number") return null;
    const pct = Math.round(q.used_percentage);
    const color = quotaColor(pct, t);
    return v_flex().gap(4)
      .child(h_flex().font_family(MONO).text_size(9.5).gap(6)
        .child(div().text_color(t.muted).child(name))
        .child(div().flex_1())
        .child(div().text_color(color).child(`${pct}%`))
        .when(Boolean(q.resets_at), (el) => el.child(div().text_color(t.dim).child(`↻ ${dur(q.resets_at * 1000 - Date.now())}`))))
      .child(segbar(t, [[pct / 100, color]], 28, 4));
  };
  const rows = [row("five_hour", "SESSION 5H"), row("seven_day", "WEEK 7D")].filter(Boolean);
  return v_flex().flex_none().px(10).pt(6).pb(10).gap(8).border_t(1).border_color(t.border)
    .child(hud(t, "USAGE", s?.cost != null ? `$${s.cost.toFixed(2)}` : null))
    .when(rows.length === 0, (el) => el.child(div().font_family(MONO).text_size(9.5).text_color(t.dim)
      .child("NO SIGNAL · start a Claude session")))
    .children(rows);
}

export function renderTree(t) {
  const list = agents();
  const all = terminals();
  const byAddress = new Map(all.map((x) => [x.address, x]));
  const order = [];
  const sorted = (spaceId) => list.filter((a) => a.space === spaceId)
    .sort((a, b) => (RANK[b.status] ?? 0) - (RANK[a.status] ?? 0) || b.seq - a.seq);

  const blocks = spaces().map((s) => {
    const mine = sorted(s.id);
    const isFolded = folded(`t:${s.id}`);
    if (!isFolded) order.push(...mine.map((a) => a.address));
    // Each space is a card holding its agents, so the space reads as the parent.
    return v_flex().gap(1).p(3).pb(isFolded || mine.length === 0 ? 3 : 6).rounded(8).border(1)
      .border_color(s.active ? t.input : t.border).bg(s.active ? t.selected : "#ffffff04")
      .child(spaceRow(t, s, isFolded, mine.length, () => toggleFold(`t:${s.id}`)))
      .when(!isFolded, (el) => el.children(mine.map((a) => agentRow(t, a, byAddress.get(a.address), all))))
      .when(!isFolded && Boolean(treeServersRow(t, s.id)), (el) => el.child(treeServersRow(t, s.id)));
  });
  setAgentOrder(order);

  const waiting = list.filter((a) => a.status === "blocked").length;
  return v_flex().size_full()
    .child(v_flex().id("halo-tree").flex_1().min_h(0).px(6).pb(6).gap(4).overflow_y_scrollbar()
      .child(h_flex().px(4).gap(6).items_center()
        .child(div().flex_1().child(hud(t, "SPACES", waiting ? `${waiting} WAITING` : `${list.length} AGENTS`)))
        .child(div().id("space-waypoint").size(20).rounded(5).flex().items_center().justify_center().cursor_pointer()
          .text_color(t.dim).hover((s) => s.bg(t.hover).text_color(t.accent))
          .tooltip("Waypoints (cmd-shift-n) · ctrl+s inside saves the focused folder")
          .on_click(() => run("mod.open", { name: "waypoint" }))
          .child(svg("mods/halo/icons/waypoint.svg").size(12)))
        .child(div().id("space-new").size(20).rounded(5).flex().items_center().justify_center().cursor_pointer()
          .text_color(t.dim).hover((s) => s.bg(t.hover).text_color(t.accent)).tooltip("New space: waypoints, repos or a typed path")
          .on_click(() => run("mod.open", { name: "halo-space" }))
          .child(svg("mods/workspace-chrome/plus.svg").size(12))))
      .children(blocks).gap(6))
    .child(usage(t));
}

export function renderBrand(t) {
  // Leaves the left 76px to the macOS traffic lights.
  return h_flex().size_full().pl(84).pr(12).gap(8).items_center()
    .child(div().size(7).rounded(4).bg(t.accent).loop("opacity", { from: 0.35, to: 1, period: 2400 }))
    .child(div().font_family(MONO).text_size(11).font_semibold().text_color(t.foreground).child("HALO"))
    .child(div().font_family(MONO).text_size(9).text_color(t.dim).child("// AGENT CONSOLE"));
}
