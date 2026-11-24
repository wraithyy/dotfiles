// Status bar for the fellowship layout: branch, agent counts, Claude quota and prompt-cache TTL.
// Quota comes from the Claude statusline JSON that the statusLine command tees to
// ~/.cache/claude-statusline/last.json (see dot_claude/settings.json.tmpl).

import { View, div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, agents, focused, theme, run, home, readTextFile, setBadge, nextCommand } from "herdr";
import { handle as nav } from "./nav.js";

const CACHE_TTL_MS = 60 * 60 * 1000; // Claude Code prompt cache, 1 h
const WARN_MS = 10 * 60 * 1000;
const CRIT_MS = 5 * 60 * 1000;

const mins = (ms) => {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m >= 1440) return `${Math.floor(m / 1440)}d${Math.floor((m % 1440) / 60)}h`;
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : `${m}m`;
};

export default class FellowshipStatus extends View {
  init(_props, cx) {
    this.idleSince = {}; // address -> ms when it stopped working
    this.last = {}; // address -> last seen status
    this.doneToday = 0; // ponytail: in memory, resets on app restart; persist if the number matters
    this.day = new Date().toDateString();
    this.quota = null;
    const load = async () => {
      try {
        const text = await readTextFile(`${home()}/.cache/claude-statusline/last.json`);
        this.quota = text ? JSON.parse(text).rate_limits ?? null : null;
      } catch {
        this.quota = null;
      }
    };
    cx.spawn(async (cx) => { await load(); cx.notify(); });
    // The status bar is always in the layout, so it also hosts the pane-navigation keys.
    cx.spawn(async () => { for (;;) nav(await nextCommand()); });
    // Data, not animation: quota moves slowly and the TTL is shown in minutes.
    cx.timer.every(30000, (cx) => { cx.spawn(async (cx) => { await load(); cx.notify(); }); });
  }

  track(list) {
    const now = Date.now();
    const today = new Date().toDateString();
    if (today !== this.day) { this.day = today; this.doneToday = 0; }
    for (const a of list) {
      const prev = this.last[a.address];
      if (prev === "working" && a.status !== "working") {
        this.idleSince[a.address] = now;
        if (a.status === "done") this.doneToday += 1;
      }
      // First sight of an idle agent: count from now, the best guess without history.
      if (prev === undefined && a.status !== "working") this.idleSince[a.address] ??= now;
      this.last[a.address] = a.status;
    }
  }

  render() {
    const t = theme();
    const list = agents();
    this.track(list);
    const space = spaces().find((s) => s.active);
    const blocked = list.filter((a) => a.status === "blocked").length;
    const working = list.filter((a) => a.status === "working").length;
    setBadge(blocked ? String(blocked) : null);

    const label = (icon, text, color = t.muted) =>
      h_flex().gap(6).items_center().text_color(color)
        .child(svg(`mods/workspace-chrome/${icon}.svg`).size(13)).child(text);
    const sep = () => div().text_color(t.border).child("│");

    // Cache TTL of the agent in view (or focused): only Claude, only while it waits on you.
    const f = focused();
    const agent = list.find((a) => a.address === f?.agent) ?? list.find((a) => a.focused);
    let ttl = null;
    if (agent?.app === "claude-code" && agent.status !== "working" && this.idleSince[agent.address]) {
      const left = CACHE_TTL_MS - (Date.now() - this.idleSince[agent.address]);
      const color = left <= 0 ? t.dim : left < CRIT_MS ? t.blocked : left < WARN_MS ? (t.ansi3 ?? t.blocked) : t.dim;
      ttl = div().text_color(color).child(left <= 0 ? "cache studená" : `cache ${mins(left)}`);
    }

    const quota = (key, name) => {
      const q = this.quota?.[key];
      if (typeof q?.used_percentage !== "number") return null;
      const pct = Math.round(q.used_percentage);
      const color = pct >= 90 ? t.blocked : pct >= 70 ? (t.ansi3 ?? t.blocked) : t.muted;
      const reset = q.resets_at ? ` · ${mins(q.resets_at * 1000 - Date.now())}` : "";
      return h_flex().text_color(color).child(`${name} ${pct}%`).child(div().text_color(t.dim).child(reset));
    };
    const q5 = quota("five_hour", "5h");
    const q7 = quota("seven_day", "7d");

    return h_flex().size_full().px(14).gap(14).items_center().bg(t.chrome).border_t(1).border_color(t.border)
      .text_size(11.8).text_color(t.muted)
      .when(Boolean(space?.branch), (el) => el.child(label("branch", space.branch)))
      .when(blocked > 0, (el) => el.child(div().id("needs").cursor_pointer().text_color(t.blocked)
        .on_click(() => run("agent.next")).child(`! ${blocked} čeká`)))
      .when(working > 0, (el) => el.child(div().text_color(t.working).child(`▸ ${working} pracuje`)))
      .when(this.doneToday > 0, (el) => el.child(div().text_color(t.done).child(`✓ ${this.doneToday} dnes`)))
      .child(div().flex_1())
      .child(div().id("collie").cursor_pointer().text_color(t.dim).hover((st) => st.text_color(t.foreground))
        .on_click(() => run("mod.open", { name: "collie" })).child("collie"))
      .child(sep())
      .when(Boolean(ttl), (el) => el.child(ttl).child(sep()))
      .when(Boolean(q5), (el) => el.child(q5))
      .when(Boolean(q7), (el) => el.child(q7));
  }
}
