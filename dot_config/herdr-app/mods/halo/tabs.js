// Top bar: the shown space's tabs (agent tabs can be hidden; they stay in the tree),
// panel toggles, and the agent dashboard kept in step with focus.

import { div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, panes, run, shared, layout } from "herdr";
import { MONO, clean, focusedAgent } from "./lib.js";

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

export function syncPanel(view) {
  const want = view.prefs.panel && Boolean(focusedAgent());
  if (want === view.panelShown) return; // edge-triggered so a manual hide/show isn't fought every render
  view.panelShown = want;
  run(want ? "layout.show" : "layout.hide", { id: "agent-panel" });
}

export function renderTabs(view, t) {
  syncPanel(view);
  const space = spaces().find((s) => s.active);
  const all = panes();
  const isAgent = (tab) => all.some((p) => p.tab === tab.id && p.program?.agent);
  const showAgents = view.prefs.agents;
  const tabs = (space?.tabs ?? []).filter((tab) => !tab.settled && (showAgents || !isAgent(tab) || tab.active));
  const sidebarHidden = Boolean(findNode(shared("layout") === "halo" ? layout() : null, "sidebar")?.hidden);

  return h_flex().size_full().px(10).gap(6).items_center()
    .child(div().font_family(MONO).text_size(10).text_color(t.accent).flex_none().child(`◢ ${space?.name ?? "—"}`.toUpperCase()))
    .child(div().w(1).h(14).bg(t.border).mx(4))
    .child(h_flex().id("halo-tabs").flex_1().min_w(0).gap(4).overflow_x_scroll()
      .children(tabs.map((tab) => pill(t, tab, all, isAgent(tab)))))
    .child(button(t, "new-term", "plus", "New terminal", () => run("tab.new", {})))
    .child(button(t, "new-agent", "square-pen", "New Claude", () => run("tab.new", { argv: ["claude"], name: "claude", focus: true })))
    .child(div().w(1).h(14).bg(t.border).mx(2))
    .child(button(t, "files", "files", "Files", side("files")))
    .child(button(t, "changes", "git-compare", "Changes", side("changes")))
    .child(div().w(1).h(14).bg(t.border).mx(2))
    .child(button(t, "agents-toggle", "layers", showAgents ? "Hide agent tabs" : "Show agent tabs",
      (_e, cx) => { view.setPref("agents", !showAgents); cx.notify(); }, showAgents))
    .child(button(t, "sidebar-toggle", "panel-left", "Toggle sidebar", () => run("layout.toggle", { id: "sidebar" }), !sidebarHidden))
    .child(button(t, "panel-toggle", "panel-right", view.prefs.panel ? "Agent dashboard: auto (click to hide)" : "Agent dashboard: hidden",
      (_e, cx) => { view.setPref("panel", !view.prefs.panel); cx.notify(); }, view.prefs.panel));
}
