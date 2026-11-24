// alt-hjkl / alt-arrows across herdr panes and nvim splits. Keys come here as
// "nav-<dir>" / "resize-<dir>". In nvim the key is forwarded; nvim moves between
// its own splits and, at an edge, calls `herdr-app do pane.go` itself.

import { panes, run, hc } from "herdr";

const KEY = { left: "h", down: "j", up: "k", right: "l" };

export function handle(command) {
  const m = /^(nav|resize)-(left|down|up|right)$/.exec(command);
  if (!m) return false;
  const [, kind, dir] = m;
  const pane = panes().find((p) => p.focused);
  if (pane?.terminal && pane.program?.key === "nvim") {
    hc(["keys", pane.terminal, kind === "nav" ? `alt+${KEY[dir]}` : `alt+${dir}`]).catch(() => null);
  } else {
    run(kind === "nav" ? "pane.go" : "pane.resize", { direction: dir });
  }
  return true;
}
