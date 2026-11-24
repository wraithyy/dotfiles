// Halo layout views. One mod, several roles (props.role) so the views share helpers:
// brand, tree, tabs, dock.

import { View } from "gpui-kit";
import { theme, nextCommand, props } from "herdr";
import { prefs, setPrefs } from "./lib.js";
import { renderTree, renderBrand } from "./tree.js";
import { renderTabs } from "./tabs.js";
import { renderDock } from "./dock.js";
import { handle as nav } from "./nav.js";

const COMMANDS = {
  "toggle-panel": () => setPrefs({ panel: !prefs().panel }),
  "toggle-agents": () => setPrefs({ agents: !prefs().agents }),
};

export default class Halo extends View {
  init(_p, cx) {
    this.role = props()?.role ?? "tree";
    this.dockShown = undefined;
    // Countdowns are shown in minutes; this is data refresh, not animation.
    if (this.role === "tree" || this.role === "dock") cx.timer.every(30000, (cx) => cx.notify());
    // Only the tab bar takes key commands, so a key runs once, not once per copy.
    if (this.role === "tabs") {
      cx.spawn(async (cx) => {
        for (;;) {
          const c = await nextCommand();
          // A failing command must not end the loop, or every later key is lost.
          try {
            await (COMMANDS[c] ?? (() => nav(c)))(this);
          } catch {
            // ignored: the next key still works
          }
          cx.notify();
        }
      });
    }
  }

  render(cx) {
    const t = theme();
    if (this.role === "brand") return renderBrand(t);
    if (this.role === "tabs") return renderTabs(this, t);
    if (this.role === "dock") return renderDock(this, t, cx);
    return renderTree(t);
  }
}
