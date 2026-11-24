// Top bar of the valley layout: every space as a banner (always visible), a new-space
// button (waypoint) and the hour. The bar doubles as the window's drag handle.

import { View, div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, run, theme, window } from "herdr";

// One heraldic colour per space, stable by name, so a client keeps its colour.
const BANNERS = ["#d4a85a", "#8fc7bd", "#c98a6b", "#a7c080", "#9aa7d6", "#c7a0c9"];
const banner = (name) => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return BANNERS[h % BANNERS.length];
};

const stop = (_e, cx) => cx.stop_propagation();

export default class ValleySpaces extends View {
  init(_props, cx) {
    // The hour changes once a minute; that's all this timer redraws for.
    cx.timer.every(60000, (cx) => cx.notify());
  }

  render() {
    const t = theme();
    const mac = window()?.platform === "macos";
    const now = new Date();
    const night = now.getHours() >= 19 || now.getHours() < 7;

    const mark = (s) => {
      if (s.status === "blocked") return div().text_size(11).font_bold().text_color(t.blocked).child("!")
        .loop("opacity", { from: 0.4, to: 1, period: 900 });
      if (s.status === "working") return svg("mods/workspace-chrome/spinner.svg").size(11).text_color(t.working).spin(1100);
      if (s.status === "done") return div().size(6).rounded(3).bg(t.done);
      return null;
    };

    const item = (s) => {
      const color = banner(s.name);
      const m = mark(s);
      return h_flex().id(`space-${s.id}`).h(28).pl(8).pr(10).gap(7).items_center().rounded(7).cursor_pointer()
        .on_mouse_down("left", stop)
        .when(s.active, (el) => el.bg(t.selected))
        .hover((st) => st.bg(t.hover))
        .on_click(() => run("space.select", { id: s.id }))
        .child(div().w(3).h(14).rounded(2).bg(color).opacity(s.active ? 1 : 0.55))
        .child(div().text_size(12.5).text_color(s.active ? t.foreground : t.muted)
          .when(s.active, (el) => el.font_semibold()).child(s.name))
        .when(Boolean(m), (el) => el.child(m));
    };

    return h_flex().size_full().pl(mac ? 84 : 12).pr(14).gap(4).items_center()
      .children(spaces().map(item))
      .child(div().id("space-new").size(26).rounded(7).flex().items_center().justify_center().cursor_pointer()
        .text_color(t.dim).hover((st) => st.bg(t.hover).text_color(t.foreground))
        .on_mouse_down("left", stop).tooltip("Nový space z waypointu")
        .on_click(() => run("mod.open", { name: "waypoint" }))
        .child(svg("mods/workspace-chrome/plus.svg").size(14)))
      .child(div().flex_1())
      .child(div().font_family("Cinzel").text_size(12).text_color(t.accent)
        .child(`${night ? "☾" : "☀"} ${now.toTimeString().slice(0, 5)}`));
  }
}
