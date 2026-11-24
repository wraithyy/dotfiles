// Right docks: themed, foldable groups. The agent dock holds AGENT and follows agent focus;
// the dev dock holds DEV (and later GIT), is toggled by hand and works without Claude.

import { div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { MONO, focusedAgent, prefs, setPrefs, section, brackets } from "./lib.js";
import { briefSection, contextSection, activitySection, cacheSection } from "./agent.js";
import { changesSection, needsRefresh, refreshChanges } from "./changes.js";
import { serversSection, foreignSection } from "./servers.js";
import { mrSection, reviewsSection, mineSection } from "./git.js";

// Each group: id, title, sections(t) -> [[id, title, info, column]] or null when it doesn't
// apply. column "a"/"b" places a section when the dock is wide enough for two columns.
const TWO_COLUMNS_FROM = 620;
export const GROUPS = [
  {
    id: "agent",
    dock: "agent",
    title: "AGENT",
    sections(t, view) {
      const term = focusedAgent();
      if (!term) return null;
      return [
        ["brief", "BRIEF", briefSection(t, term), "a"],
        ["context", "CONTEXT", contextSection(t, term), "b"],
        ["activity", "ACTIVITY", activitySection(t, term), "a"],
        ["cache", "CACHE", cacheSection(t, term), "b"],
        ["changes", "CHANGES", changesSection(t, view, term), "b"],
      ];
    },
  },
  {
    id: "git",
    dock: "dev",
    title: "GIT",
    sections(t) {
      const list = [["mr", "THIS BRANCH", mrSection(t), "a"], ["reviews", "REVIEW QUEUE", reviewsSection(t), "a"], ["mine", "MY MRS", mineSection(t), "b"]]
        .filter(([, , info]) => info);
      return list.length ? list : null;
    },
  },
  {
    id: "dev",
    dock: "dev",
    title: "DEV",
    sections(t) {
      const list = [["servers", "SERVERS", serversSection(t), "a"], ["foreign", "OTHER APPS", foreignSection(t), "b"]]
        .filter(([, , info]) => info);
      return list.length ? list : null;
    },
  },
];

export function visibleGroups(t, view, dock = "agent") {
  return GROUPS.filter((g) => g.dock === dock).map((g) => ({ ...g, list: g.sections(t, view) })).filter((g) => g.list);
}

function summaryOf(list) {
  return list.map(([, , info]) => info?.summary).filter(Boolean).slice(0, 2).join(" · ");
}

function groupBody(t, list, wide) {
  const sectionsOf = (items) => items.map(([id, title, info]) => section(t, `s:${id}`, title, info)).filter(Boolean);
  if (!wide) return v_flex().gap(12).children(sectionsOf(list));
  const column = (key) => v_flex().flex_1().min_w(0).gap(12).children(sectionsOf(list.filter((item) => (item[3] ?? "a") === key)));
  return h_flex().gap(16).items_start().child(column("a")).child(div().w(1).self_stretch().bg(t.border)).child(column("b"));
}

const NEXT_COLUMNS = { auto: "1", 1: "2", 2: "auto" };
const COLUMNS_LABEL = { auto: "AUTO", 1: "1 COL", 2: "2 COL" };

function columnsToggle(t, mode) {
  return h_flex().id("dock-columns").h(20).px(6).gap(5).rounded(4).items_center().cursor_pointer()
    .text_color(t.dim).hover((s) => s.bg(t.hover).text_color(t.accent))
    .tooltip(`Columns: ${COLUMNS_LABEL[mode]} (click to switch)`)
    .on_click(() => setPrefs({ columns: NEXT_COLUMNS[mode] }))
    .child(svg(`mods/halo/icons/columns-${mode === "auto" ? "auto" : mode}.svg`).size(13))
    .child(div().font_family(MONO).text_size(9).child(COLUMNS_LABEL[mode]));
}

export function renderDock(view, t, cx, dock = "agent") {
  const term = dock === "agent" ? focusedAgent() : null;
  if (term && needsRefresh(view, term)) cx.spawn(async (cx) => { await refreshChanges(view, term); cx.notify(); });
  const groups = visibleGroups(t, view, dock);
  const mode = String(prefs().columns ?? "auto");
  const wide = mode === "2" || (mode === "auto" && (view.size?.width ?? 0) >= TWO_COLUMNS_FROM);
  const body = v_flex().id("dock").size_full().p(12).gap(14).overflow_y_scrollbar()
    .child(h_flex().h(20).justify_end().child(columnsToggle(t, mode)))
    .when(groups.length === 0, (el) => el.child(div().text_size(11).text_color(t.dim)
      .child(dock === "dev" ? "No repo remote, dev servers or dev-port listeners here." : "Nothing to show here.")))
    .children(groups.map((g) => section(t, `g:${g.id}`, g.title, {
      summary: summaryOf(g.list),
      body: groupBody(t, g.list, wide),
    }, { group: true })));
  return brackets(div().id("dock-root").size_full()
    .on_size_change((size, cx) => { view.size = size; cx.notify(); }).child(body), t);
}
