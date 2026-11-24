// Close every space except the shown one. Opened as a dialog (mod.open:space-tidy):
// lists what will go, warns about working agents, Enter closes them, Esc cancels.

import { View, div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { spaces, run, props, closeOverlay, theme } from "herdr";

const others = () => spaces().filter((s) => !s.active);

export default class SpaceTidy extends View {
  init(_props, cx) {
    this.handle = cx.focus_handle();
    this.handle.focus();
  }

  close() {
    for (const s of others()) run("space.close", { id: s.id, confirmed: true });
    closeOverlay(props().overlay);
  }

  render() {
    const t = theme();
    const list = others();
    const row = (s) => h_flex().gap(8).items_center()
      .child(div().flex_1().truncate().text_color(t.foreground).child(s.name))
      .when(s.status === "working" || s.status === "blocked", (el) =>
        el.child(div().text_size(11).text_color(t[s.status]).child(s.status === "working" ? "agent pracuje" : "agent čeká")));
    const button = (id, label, bg, fg, onClick) =>
      h_flex().id(id).h(30).px(14).items_center().rounded(8).bg(bg).text_color(fg).cursor_pointer()
        .hover((st) => st.opacity(0.88)).on_click(onClick).child(label);
    return v_flex().id("space-tidy").track_focus(this.handle)
      .on_key_down((e, cx) => {
        if (e.key === "enter" && list.length) this.close();
        else if (e.key === "escape") closeOverlay(props().overlay);
        else return;
        cx.stop_propagation();
      })
      .size_full().p(18).gap(12).rounded(8).bg(t.popover).text_size(13)
      .child(div().text_size(15).font_semibold().text_color(t.foreground)
        .child(list.length ? `Zavřít ${list.length} ${list.length === 1 ? "space" : "spaces"}?` : "Žádné další spaces"))
      .child(v_flex().flex_1().min_h(0).gap(6).overflow_y_scrollbar().children(list.map(row)))
      .child(h_flex().justify_end().gap(8).text_size(12)
        .child(button("no", "Zrušit", t.raised, t.foreground, () => closeOverlay(props().overlay)))
        .when(list.length > 0, (el) => el.child(button("yes", "Zavřít", t.blocked, t.background, () => this.close()))));
  }
}
