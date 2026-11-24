// Left rail of the valley layout: the shown space's tabs, split in two. Tabs with an
// agent come first as companion portraits; app tabs (nvim, lazygit, shells) follow as
// plain icons under a small divider. The bottom holds new-tab and panel buttons.

import { View, div, image, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { spaces, agents, panes, run, theme } from "herdr";

const HERO = { claude: "wizard", codex: "dwarf" };
const hero = (key) => `mods/valley-fellowship/sprites/${HERO[key] ?? "elf"}.svg`;

// The pane that speaks for a tab: its focused one, else the first.
const lead = (tabId, all) => {
  const mine = all.filter((p) => p.tab === tabId);
  return mine.find((p) => p.focused) ?? mine[0];
};

export default class ValleyRail extends View {
  render() {
    const t = theme();
    const space = spaces().find((s) => s.active);
    const tabs = space?.tabs ?? [];
    const all = panes();
    const list = agents();
    const agentOf = (tab) => list.find((a) => a.tab === tab.id && a.status === tab.status) ?? list.find((a) => a.tab === tab.id);
    const agentTabs = tabs.filter((tab) => tab.status != null && agentOf(tab));
    const appTabs = tabs.filter((tab) => !agentTabs.includes(tab));

    const frame = (tab, body, ring) => div().id(`tab-${tab.id}`).size(44).flex_none().rounded(10)
      .flex().items_center().justify_center().cursor_pointer().relative()
      .border(1.5).border_color(tab.active ? t.accent : ring ?? "#00000000")
      .when(tab.active, (el) => el.bg(t.selected))
      .hover((st) => st.bg(t.hover))
      .on_click(() => run("tab.select", { id: tab.id }))
      .child(body);

    const agentTab = (tab) => {
      const a = agentOf(tab);
      const s = tab.status;
      let pic = image(hero(a?.program?.key)).w(28).h(28);
      if (s === "blocked") pic = pic.loop("opacity", { from: 0.35, to: 1, period: 700 });
      else if (s === "idle") pic = pic.opacity(0.5);
      const ring = s === "blocked" ? t.blocked : s === "done" ? t.done : s === "working" ? t.working + "80" : null;
      return frame(tab, pic, ring).tooltip(`${tab.name} · ${a?.title || a?.program?.name || ""}`)
        .when(s === "working", (el) => el.child(svg("mods/workspace-chrome/spinner.svg").size(10)
          .absolute().right(2).bottom(2).text_color(t.working).spin(1100)));
    };

    const appTab = (tab) => {
      const p = lead(tab.id, all)?.program;
      const icon = !p?.icon ? svg("mods/workspace-chrome/terminal.svg").size(18).text_color(t.muted)
        : p.tint ? svg(p.icon).size(18).text_color(tab.active ? t.foreground : t.muted)
        : image(p.icon).w(18).h(18);
      return frame(tab, icon).tooltip(`${tab.name} · ${p?.name ?? "terminál"}`);
    };

    const button = (id, icon, tip, onClick) => div().id(id).size(32).rounded(8).flex().items_center().justify_center()
      .cursor_pointer().text_color(t.dim).hover((st) => st.bg(t.hover).text_color(t.foreground))
      .tooltip(tip).on_click(onClick).child(svg(`mods/workspace-chrome/${icon}.svg`).size(15));

    const divider = () => h_flex().w(36).gap(4).items_center().my(4)
      .child(div().flex_1().h(1).bg(t.accent).opacity(0.35))
      .child(div().text_size(8).text_color(t.accent).opacity(0.7).child("◆"))
      .child(div().flex_1().h(1).bg(t.accent).opacity(0.35));

    return v_flex().size_full().items_center().pt(6).pb(10).gap(6)
      .child(v_flex().id("rail-tabs").flex_1().min_h(0).w_full().items_center().gap(6).overflow_y_scrollbar()
        .children(agentTabs.map(agentTab))
        .when(agentTabs.length > 0 && appTabs.length > 0, (el) => el.child(divider()))
        .children(appTabs.map(appTab)))
      .child(button("new-agent", "square-pen", "Nový Claude tab", () =>
        run("tab.new", { argv: ["claude"], name: "claude" })))
      .child(button("new-term", "plus", "Nový terminál", () => run("tab.new", {})))
      .child(button("files", "files", "Soubory", () => { run("layout.select", { stack: "panel-body", child: "files" }); run("layout.toggle", { id: "panel" }); }))
      .child(button("changes", "git-compare", "Změny", () => { run("layout.select", { stack: "panel-body", child: "changes" }); run("layout.toggle", { id: "panel" }); }));
  }
}
