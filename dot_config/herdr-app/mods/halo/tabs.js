// Top bar: the shown space's tabs (agent tabs can be hidden; they stay in the tree),
// dock group chips and panel toggles. Also keeps the dock in step with what applies.

import { div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, panes, agents, run, shared, layout } from "herdr";
import { MONO, clean, prefs, setPrefs } from "./lib.js";
import { GROUPS, visibleGroups } from "./dock.js";

const stop = (_e, cx) => cx.stop_propagation();

function lead(tabId, all) {
  const mine = all.filter((p) => p.tab === tabId);
  return mine.find((p) => p.focused) ?? mine[0];
}

function icon(t, program, active) {
  if (!program?.icon) return svg("mods/workspace-chrome/terminal.svg").size(13).text_color(active ? t.accent : t.dim);
  return program.tint ? svg(program.icon).size(13).text_color(active ? t.foreground : t.muted) : image(program.icon).w(13).h(13);
}

function pill(t, tab, all, agentTab) {
  const p = lead(tab.id, all);
  const name = agentTab ? clean(p?.title) || "agent" : tab.named ? tab.name : p?.program?.name ?? `term ${tab.index}`;
  return h_flex().id(`tab-${tab.id}`).h(26).px(10).gap(7).items_center().rounded(6).cursor_pointer().max_w(220)
    .border(1).border_color(tab.active ? (agentTab ? t.working : t.accent) : "#00000000")
    .when(tab.active, (el) => el.bg(t.selected))
    .hover((s) => s.bg(t.hover))
    .on_mouse_down("left", stop)
    .on_click(() => run("tab.select", { id: tab.id }))
    .child(agentTab ? div().font_family(MONO).text_size(9.5).text_color(t.working).child("◆ AGENT") : icon(t, p?.program, tab.active))
    .child(div().min_w(0).truncate().text_size(12).text_color(tab.active ? t.foreground : t.muted).child(name));
}

function button(t, id, glyph, tip, onClick, on = false) {
  return div().id(id).size(26).rounded(6).flex().items_center().justify_center().cursor_pointer()
    .text_color(on ? t.accent : t.dim).when(on, (el) => el.bg(t.selected))
    .hover((s) => s.bg(t.hover).text_color(t.accent)).tooltip(tip)
    .on_mouse_down("left", stop).on_click(onClick)
    .child(svg(`mods/workspace-chrome/${glyph}.svg`).size(14));
}

function chip(t, group, on, available) {
  return div().id(`chip-${group.id}`).h(20).px(7).rounded(4).flex().items_center().cursor_pointer()
    .border(1).border_color(on ? t.input : t.border)
    .font_family(MONO).text_size(9).text_color(on ? (available ? t.accent : t.muted) : t.dim)
    .when(on, (el) => el.bg(t.selected))
    .hover((s) => s.bg(t.hover))
    .tooltip(`${group.title} group ${on ? "on" : "off"}${available ? "" : " (nothing to show now)"}`)
    .on_mouse_down("left", stop)
    .on_click(() => {
      const p = prefs();
      setPrefs({ groups: { ...p.groups, [group.id]: !p.groups[group.id] } });
    })
    .child(group.title);
}

function findNode(node, id) {
  if (!node || typeof node !== "object") return null;
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const hit = findNode(child, id);
    if (hit) return hit;
  }
  return null;
}

const side = (child) => () => { run("layout.select", { stack: "side-body", child }); run("layout.toggle", { id: "side" }); };
const sep = (t) => div().w(1).h(14).bg(t.border).mx(2);

// Edge-triggered so the dock isn't re-shown or re-hidden on every render.
function syncDock(view, want) {
  if (want === view.dockShown) return;
  view.dockShown = want;
  run(want ? "layout.show" : "layout.hide", { id: "dock" });
}

export function renderTabs(view, t) {
  const p = prefs();
  const shownGroups = visibleGroups(t);
  syncDock(view, p.panel && shownGroups.length > 0);

  const space = spaces().find((s) => s.active);
  const all = panes();
  const isAgent = (tab) => all.some((x) => x.tab === tab.id && x.program?.agent);
  const tabs = (space?.tabs ?? []).filter((tab) => !tab.settled && (p.agents || !isAgent(tab) || tab.active));
  const sidebarHidden = Boolean(findNode(shared("layout") === "halo" ? layout() : null, "sidebar")?.hidden);
  const available = new Set(shownGroups.map((g) => g.id));

  const waiting = agents().filter((a) => a.status === "blocked").length;
  return h_flex().size_full().px(10).gap(6).items_center()
    .when(waiting > 0, (el) => el.child(div().id("waiting-chip").h(22).px(8).rounded(5).flex().items_center().cursor_pointer()
      .bg(`${t.blocked}26`).border(1).border_color(t.blocked).font_family(MONO).text_size(10).text_color(t.blocked)
      .tooltip("Reply to waiting agents (cmd-shift-j)")
      .on_mouse_down("left", stop).on_click(() => run("mod.open", { name: "halo-reply" }))
      .child(`! ${waiting} WAITING`)))
    .child(div().font_family(MONO).text_size(10).text_color(t.accent).flex_none().child(`◢ ${space?.name ?? "—"}`.toUpperCase()))
    .child(div().w(1).h(14).bg(t.border).mx(4))
    .child(h_flex().id("halo-tabs").flex_1().min_w(0).gap(4).overflow_x_scroll()
      .children(tabs.map((tab) => pill(t, tab, all, isAgent(tab)))))
    .child(button(t, "new-term", "plus", "New terminal", () => run("tab.new", {})))
    .child(button(t, "new-agent", "square-pen", "New Claude", () => run("tab.new", { argv: ["claude"], name: "claude", focus: true })))
    .child(button(t, "new-task", "git-branch", "New task: worktree + Claude (cmd-shift-t)", () => run("mod.open", { name: "halo-task" })))
    .child(sep(t))
    .child(button(t, "files", "files", "Files", side("files")))
    .child(button(t, "changes", "git-compare", "Changes", side("changes")))
    .child(sep(t))
    .child(button(t, "agents-toggle", "layers", p.agents ? "Hide agent tabs" : "Show agent tabs",
      () => setPrefs({ agents: !p.agents }), p.agents))
    .child(button(t, "sidebar-toggle", "panel-left", "Toggle sidebar", () => run("layout.toggle", { id: "sidebar" }), !sidebarHidden))
    .child(sep(t))
    .child(h_flex().gap(3).children(GROUPS.map((g) => chip(t, g, p.groups[g.id], available.has(g.id)))))
    .child(button(t, "panel-toggle", "panel-right", p.panel ? "Dock: auto (click to hide)" : "Dock: hidden",
      () => setPrefs({ panel: !p.panel }), p.panel));
}
