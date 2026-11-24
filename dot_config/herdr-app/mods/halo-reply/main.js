// Quick reply (popup, mod.open:halo-reply): every agent waiting on you, the tail of its
// screen, and an input. Enter types the reply into the agent; a single digit in an
// empty input picks a permission option; Tab cycles agents; ctrl+o jumps to the agent.

import { View, div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { agents, terminals, hc, run, theme, props, closeOverlay } from "herdr";

const MONO = "JetBrainsMono Nerd Font Mono";
const TAIL_LINES = 18;

const clean = (s) => (s ?? "").replace(/^[^\p{L}\p{N}\p{Ps}\p{Pi}]+/u, "").trim();

function whereOf(address) {
  const raw = terminals().find((t) => t.address === address)?.labels?.["halo.where"];
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

// Claude pads its screen with blank rows; keep the last meaningful ones.
export function screenTail(text, lines = TAIL_LINES) {
  const rows = (text ?? "").replace(/\s+$/, "").split("\n").map((r) => r.replace(/\s+$/, ""));
  return rows.slice(-lines).join("\n");
}

export default class HaloReply extends View {
  init(_props, cx) {
    this.at = 0;
    this.screen = {};
    this.sent = null;
    this.input = InputState.new({ placeholder: "Reply… (empty + digit picks an option)" });
    this.input.on("submit", (_e, cx) => this.send(cx));
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    this.handle = cx.focus_handle();
    this.loadScreen(cx);
    // The prompt on screen changes while you read it; refresh the tail now and then.
    cx.timer.every(2000, (cx) => this.loadScreen(cx));
  }

  waiting() {
    return agents().filter((a) => a.status === "blocked");
  }

  current() {
    const list = this.waiting();
    if (this.at >= list.length) this.at = Math.max(0, list.length - 1);
    return list[this.at];
  }

  loadScreen(cx) {
    const a = this.current();
    if (!a || this.reading) return; // a slow hc read must not pile up under the 2 s refresh
    this.reading = true;
    cx.spawn(async (cx) => {
      const r = await hc(["read", a.address]).catch(() => null);
      this.reading = false;
      if (r) this.screen = { ...this.screen, [a.address]: screenTail(r.stdout) };
      cx.notify();
    });
  }

  close() { closeOverlay(props().overlay); }

  async deliver(address, text) {
    // A lone digit answers a permission prompt as a key press; anything else is typed and sent.
    // --force: a waiting agent is "blocked", and hc send refuses to type into it otherwise.
    // "--" keeps a reply starting with "-" from being read as an option.
    const r = /^[0-9]$/.test(text) ? await hc(["keys", address, text]) : await hc(["send", "--force", address, "--", text]);
    if (r?.code !== 0) throw new Error(r?.stderr || "hc failed");
  }

  send(cx) {
    const a = this.current();
    const text = this.input.value().trim();
    if (!a || !text) return;
    cx.spawn(async (cx) => {
      try {
        await this.deliver(a.address, text);
      } catch (error) {
        // Keep the text so nothing typed is lost; say why.
        this.sent = { address: a.address, text: `FAILED: ${String(error?.message ?? error).trim().split("\n")[0]}` };
        cx.notify();
        return;
      }
      this.input.set_value("");
      this.sent = { address: a.address, text };
      if (this.waiting().filter((x) => x.address !== a.address).length === 0) this.close();
      else this.loadScreen(cx);
      cx.notify();
    });
  }

  move(by, cx) {
    const n = this.waiting().length;
    if (n === 0) return;
    this.at = (this.at + by + n) % n;
    this.loadScreen(cx);
  }

  render() {
    const t = theme();
    const list = this.waiting();
    const a = this.current();
    const where = a ? whereOf(a.address) : null;

    const item = (x, i) => h_flex().id(`w-${x.address}`).px(10).py(7).gap(8).items_start().rounded(6).cursor_pointer()
      .when(i === this.at, (el) => el.bg(t.selected).border_l(2).border_color(t.blocked))
      .hover((s) => s.bg(t.hover))
      .on_click((_e, cx) => { this.at = i; this.loadScreen(cx); cx.notify(); })
      .child(div().mt(5).size(6).rounded(3).bg(t.blocked).flex_none())
      .child(v_flex().flex_1().min_w(0).gap(2)
        .child(div().text_size(12.5).truncate().text_color(i === this.at ? t.foreground : t.muted).child(clean(x.title) || x.address))
        .child(div().font_family(MONO).text_size(9.5).text_color(t.dim).child([x.space_name, x.tab_name].filter(Boolean).join(" · "))));

    return v_flex().id("halo-reply").track_focus(this.handle).size_full().p(16).gap(12).bg(t.popover)
      .on_key_down((e, cx) => {
        const k = e.key;
        if (k === "escape") return this.close();
        if (k === "tab") this.move(e.modifiers.shift ? -1 : 1, cx);
        else if (e.modifiers.control && k === "o" && a) { this.close(); run("agent.focus", { terminal: a.address }); }
        else return;
        cx.stop_propagation();
        cx.notify();
      })
      .child(h_flex().gap(8).items_center()
        .child(div().w(2).h(12).bg(t.blocked))
        .child(div().font_family(MONO).text_size(11).font_semibold().text_color(t.blocked).child(`WAITING ON YOU · ${list.length}`))
        .child(div().flex_1())
        .child(div().font_family(MONO).text_size(9.5).text_color(t.dim).child("tab next · enter send · digit = option · ctrl+o open · esc")))
      .when(list.length === 0, (el) => el.child(div().py(20).text_size(13).text_color(t.dim).child("Nobody is waiting on you.")))
      .when(list.length > 0, (el) => el.child(h_flex().flex_1().min_h(0).gap(12).items_start()
        .child(v_flex().w(230).flex_none().gap(2).children(list.map(item)))
        .child(v_flex().flex_1().min_w(0).h_full().gap(10)
          .when(Boolean(where?.waiting), (c) => c.child(div().px(10).py(6).rounded(6).bg(`${t.blocked}22`)
            .text_size(12.5).text_color(t.foreground).child(where.waiting)))
          .child(div().id("tail").flex_1().min_h(0).p(10).rounded(6).bg(t.background).border(1).border_color(t.border)
            .overflow_y_scrollbar().font_family(MONO).text_size(11).text_color(t.muted)
            .child(this.screen[a?.address] ?? "reading…"))
          .child(h_flex().h(38).flex_none().px(10).items_center().rounded(8).border(1).border_color(t.blocked).bg(t.background)
            .child(Input.new(this.input).flex_1().h_full().text_size(13).text_color(t.foreground)))
          .when(Boolean(this.sent), (c) => c.child(div().font_family(MONO).text_size(9.5).text_color(t.dim)
            .child(`SENT TO ${this.sent.address}: ${this.sent.text}`))))));
  }
}
