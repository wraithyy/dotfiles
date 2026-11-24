// Right-click menus for halo (popup): props { kind: "agent" | "port" | "mr", target }.
// Items run Herdr commands or a small exec; keyboard: up/down, enter, esc.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { run, exec, hc, theme, props, closeOverlay, agents, panes } from "herdr";

// Same guard as the dock: the pid may be stale, so kill only the same program.
async function stopListener(tg) {
  const r = await exec("ps", ["-p", String(tg.pid), "-o", "comm="]).catch(() => null);
  const comm = (r?.stdout.trim().split("/").pop() ?? "").toLowerCase();
  const cmd = String(tg.cmd).toLowerCase();
  if (comm && (comm.startsWith(cmd) || cmd.startsWith(comm))) await exec("kill", [String(tg.pid)]).catch(() => null);
}

const ICON = (name) => (name.startsWith("mods/") ? name : `mods/workspace-chrome/${name}.svg`);
const copy = (text) => exec("osascript", ["-e", `set the clipboard to ${JSON.stringify(text)}`]).catch(() => null);
const openUrl = (url) => exec("open", [url]).catch(() => null);

function agentItems(tg) {
  const a = agents().find((x) => x.address === tg.terminal);
  if (!a) return [];
  const inTab = panes().some((p) => p.pane === a.pane);
  return [
    ["Show", "terminal", () => run("agent.focus", { terminal: a.address })],
    ["Peek", "search", () => run("terminal.peek", { terminal: a.address })],
    ...(a.status === "blocked" ? [["Reply…", "mods/halo/icons/ask.svg", () => run("mod.open", { name: "halo-reply" })]] : []),
    [a.pinned ? "Unpin" : "Pin to top", a.pinned ? "pin-off" : "pin", () => run("terminal.pin", { terminal: a.address, pinned: !a.pinned })],
    ...(inTab ? [["Rename", "square-pen", () => run("pane.rename", { pane: a.pane })]] : []),
    ...(a.status === "working" ? [["Interrupt (esc)", "square", () => hc(["interrupt", a.address]).catch(() => null)]] : []),
    ["Kill terminal", "x", () => run("terminal.kill", { terminal: a.address }), "danger"],
  ];
}

function portItems(tg) {
  const url = `http://localhost:${tg.port}`;
  return [
    ["Open in browser", "mods/halo/icons/next.svg", () => openUrl(url)],
    ["Copy URL", "file-text", () => copy(url)],
    ...(tg.terminal ? [["Show terminal", "terminal", () => run("pane.focus", { terminal: tg.terminal })]] : []),
    [`Stop ${tg.cmd ?? ""} (SIGTERM)`, "x", () => stopListener(tg), "danger"],
  ];
}

function mrItems(tg) {
  return [
    ["Open", "mods/halo/icons/next.svg", () => openUrl(tg.url)],
    ["Copy link", "file-text", () => copy(tg.url)],
    ["Review with Claude", "square-pen", () => run("tab.new", { argv: ["claude"], name: `review ${tg.id}`, task: `Review this merge request and report findings: ${tg.url}` })],
  ];
}

export const ITEMS = { agent: agentItems, port: portItems, mr: mrItems };

export default class HaloMenu extends View {
  init(_props, cx) {
    this.at = 0;
    this.handle = cx.focus_handle();
    this.handle.focus();
  }

  items() {
    const p = props() ?? {};
    return (ITEMS[p.kind] ?? (() => []))(p.target ?? {});
  }

  pick(item) {
    if (!item) return;
    closeOverlay(props().overlay);
    item[2]();
  }

  render() {
    const t = theme();
    const items = this.items();
    return v_flex().id("halo-menu").track_focus(this.handle).w_full().p(5).gap(1).bg(t.popover)
      .on_key_down((e, cx) => {
        if (e.key === "escape") return closeOverlay(props().overlay);
        if (e.key === "down") this.at = Math.min(this.at + 1, items.length - 1);
        else if (e.key === "up") this.at = Math.max(this.at - 1, 0);
        else if (e.key === "enter") return this.pick(items[this.at]);
        else return;
        cx.stop_propagation();
        cx.notify();
      })
      .children(items.map(([label, icon, , tone], i) => h_flex().id(`mi-${i}`).h(28).px(9).gap(9).items_center().rounded(5).cursor_pointer()
        .when(i === this.at, (el) => el.bg(t.selected))
        .hover((s) => s.bg(t.hover))
        .on_click(() => this.pick(items[i]))
        .child(svg(ICON(icon)).size(13).text_color(tone === "danger" ? t.blocked : t.muted))
        .child(div().text_size(12.5).text_color(tone === "danger" ? t.blocked : t.foreground).child(label))));
  }
}
