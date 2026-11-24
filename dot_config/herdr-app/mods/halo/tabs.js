// Top bar: the shown space's tabs (agent tabs can be hidden; they stay in the tree),
// dock toggles. Keeps the agent dock in step with agent focus and the dev dock with its toggle.

import { div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, panes, agents, run, shared, layout, openOverlay } from "herdr";
import { MONO, clean, prefs, setPrefs } from "./lib.js";
import { visibleGroups } from "./dock.js";

const stop = (_e, cx) => cx.stop_propagation();

function lead(tabId, all) {
  const mine = all.filter((p) => p.tab === tabId);
  return mine.find((p) => p.focused) ?? mine[0];
}

function icon(t, program, active) {
  if (!program?.icon) return svg("mods/workspace-chrome/terminal.svg").size(13).text_color(active ? t.accent : t.dim);
  return program.tint ? svg(program.icon).size(13).text_color(active ? t.foreground : t.muted) : image(program.icon).w(13).h(13);
}

function pill(t, tab, all, agentTab, spaceId) {
  const p = lead(tab.id, all);
  const name = agentTab ? clean(p?.title) || "agent" : tab.named ? tab.name : p?.program?.name ?? `term ${tab.index}`;
  return h_flex().id(`tab-${tab.id}`).h(26).px(10).gap(7).items_center().rounded(6).cursor_pointer().max_w(220)
    .border(1).border_color(tab.active ? (agentTab ? t.working : t.accent) : "#00000000")
    .when(tab.active, (el) => el.bg(t.selected))
    .hover((s) => s.bg(t.hover))
    .on_mouse_down("left", stop)
    .on_click(() => run("tab.select", { id: tab.id }))
    // Herdr's own tab menu (rename, new tab, close), as the shipped tab bar opens it.
    .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); openOverlay({ mod: "menu", kind: "popup", width: 200, height: 100, props: { tab: "tab", target: { id: tab.id, space: spaceId } } }); })
    .child(agentTab ? div().font_family(MONO).text_size(9.5).text_color(t.working).child("◆ AGENT") : icon(t, p?.program, tab.active))
    .child(div().min_w(0).truncate().text_size(12).text_color(tab.active ? t.foreground : t.muted).child(name));
}

// glyph: a workspace-chrome icon name, or a full "mods/…svg" path.
function button(t, id, glyph, tip, onClick, on = false) {
  return div().id(id).size(26).rounded(6).flex().items_center().justify_center().cursor_pointer()
    .text_color(on ? t.accent : t.dim).when(on, (el) => el.bg(t.selected))
    .hover((s) => s.bg(t.hover).text_color(t.accent)).tooltip(tip)
    .on_mouse_down("left", stop).on_click(onClick)
    .child(svg(glyph.startsWith("mods/") ? glyph : `mods/workspace-chrome/${glyph}.svg`).size(14));
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

// Edge-triggered so a dock isn't re-shown or re-hidden on every render.
function syncDock(view, id, want) {
  view.shown ??= {};
  if (want === view.shown[id]) return;
  view.shown = { ...view.shown, [id]: want };
  run(want ? "layout.show" : "layout.hide", { id });
}

export function renderTabs(view, t) {
  const p = prefs();
  syncDock(view, "dock", p.panel && visibleGroups(t, view, "agent").length > 0);
  syncDock(view, "devdock", p.devdock);

  const space = spaces().find((s) => s.active);
  const all = panes();
  const isAgent = (tab) => all.some((x) => x.tab === tab.id && x.program?.agent);
  const tabs = (space?.tabs ?? []).filter((tab) => !tab.settled && (p.agents || !isAgent(tab) || tab.active));
  const sidebarHidden = Boolean(findNode(shared("layout") === "halo" ? layout() : null, "sidebar")?.hidden);

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
      .children(tabs.map((tab) => pill(t, tab, all, isAgent(tab), space?.id))))
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
    .child(button(t, "devdock-toggle", "mods/halo/icons/dev.svg", p.devdock ? "Hide dev dock (servers, ports)" : "Show dev dock (servers, ports)",
      () => setPrefs({ devdock: !p.devdock }), p.devdock))
    .child(button(t, "panel-toggle", "panel-right", p.panel ? "Agent dock: auto (click to hide)" : "Agent dock: hidden",
      () => setPrefs({ panel: !p.panel }), p.panel));
}
