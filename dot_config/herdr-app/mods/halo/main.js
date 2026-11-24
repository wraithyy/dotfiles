// Halo layout views. One mod, several roles (props.role) so the views share helpers:
// brand, tree, tabs, context, activity, cache.

import { View, div } from "gpui-kit";
import { theme, nextCommand, props } from "herdr";
import { brackets } from "./lib.js";
import { renderTree, renderBrand } from "./tree.js";
import { renderTabs } from "./tabs.js";
import { renderContext, renderActivity, renderCache } from "./agent.js";
import { handle as nav } from "./nav.js";

const PANELS = { context: renderContext, activity: renderActivity, cache: renderCache };

export default class Halo extends View {
  init(_p, cx) {
    this.role = props()?.role ?? "tree";
    this.panelShown = undefined;
    try { this.fold = JSON.parse(localStorage.getItem("fold") ?? "{}") ?? {}; } catch { this.fold = {}; }
    // Tab bar toggles: agent dashboard auto-show, agent tabs in the bar.
    this.prefs = { panel: true, agents: true };
    try { this.prefs = { ...this.prefs, ...JSON.parse(localStorage.getItem("prefs") ?? "{}") }; } catch { /* defaults */ }
    // Countdowns are shown in minutes; this is data refresh, not animation.
    if (["tree", "cache", "activity"].includes(this.role)) cx.timer.every(30000, (cx) => cx.notify());
    // Only the tab bar takes key commands, so a key runs once, not once per copy.
    if (this.role === "tabs") {
      cx.spawn(async (cx) => {
        for (;;) {
          const c = await nextCommand();
          if (c === "toggle-panel") this.setPref("panel", !this.prefs.panel);
          else if (c === "toggle-agents") this.setPref("agents", !this.prefs.agents);
          else nav(c);
          cx.notify();
        }
      });
    }
  }

  setPref(key, value) {
    this.prefs = { ...this.prefs, [key]: value };
    this.panelShown = undefined; // re-sync the panel against the new preference
    try { localStorage.setItem("prefs", JSON.stringify(this.prefs)); } catch { /* per-viewer convenience only */ }
  }

  toggleFold(id) {
    this.fold = { ...this.fold, [id]: !this.fold[id] };
    try { localStorage.setItem("fold", JSON.stringify(this.fold)); } catch { /* per-viewer convenience only */ }
  }

  render() {
    const t = theme();
    if (this.role === "brand") return renderBrand(t);
    if (this.role === "tabs") return renderTabs(this, t);
    const panel = PANELS[this.role];
    if (panel) return brackets(div().size_full().child(panel(t)), t);
    return renderTree(this, t);
  }
}
