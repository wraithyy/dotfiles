// DEV: listening TCP ports mapped to the space whose terminal started them. The tab bar
// copy polls (lsof + ps every 10 s) and publishes shared("halo.servers"); the tree shows a
// port line per space and the dock lists the shown space's servers and foreign listeners.

import { div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { exec, terminals, shared, setShared, spaces } from "herdr";
import { MONO } from "./lib.js";
import { parseListeners, parseParents, attribute } from "./parse.js";

export const POLL_MS = 10000;

function owners() {
  const map = new Map();
  for (const t of terminals()) {
    if (t.state !== "live") continue;
    const owner = { terminal: t.address, space: t.labels?.["herdr.space"] ?? null };
    if (t.pid) map.set(t.pid, owner);
    if (t.foreground?.pid) map.set(t.foreground.pid, owner);
  }
  return map;
}

export async function pollServers() {
  const [lsof, ps] = await Promise.all([
    exec("lsof", ["-nP", "-iTCP", "-sTCP:LISTEN", "-Fpcn"], { timeout: 5000 }).catch(() => null),
    exec("ps", ["-Ao", "pid=,ppid="], { timeout: 5000 }).catch(() => null),
  ]);
  if (!lsof || !ps) return;
  const next = attribute(parseListeners(lsof.stdout), parseParents(ps.stdout), owners());
  // Every setShared re-renders all copies; publish only real changes.
  if (JSON.stringify(next) !== JSON.stringify(shared("halo.servers") ?? null)) setShared("halo.servers", next);
}

export function serversOf(spaceId) {
  return shared("halo.servers")?.bySpace?.[spaceId] ?? [];
}

const openUrl = (port) => exec("open", [`http://localhost:${port}`]).catch(() => null);
const stop = (pid) => exec("kill", [String(pid)]).catch(() => null);

// One line in a space card of the tree.
export function treeServersRow(t, spaceId) {
  const list = serversOf(spaceId);
  if (!list.length) return null;
  return h_flex().ml(13).pl(10).pr(8).py(3).gap(6).items_center().flex_wrap().border_l(1).border_color(t.border)
    .child(svg("mods/workspace-chrome/server.svg").size(11).text_color(t.ansi2))
    .children(list.map((l) => div().id(`port-${spaceId}-${l.port}`).px(5).rounded(4).cursor_pointer()
      .font_family(MONO).text_size(9.5).text_color(t.ansi2).bg(`${t.ansi2}1a`)
      .hover((s) => s.bg(`${t.ansi2}33`)).tooltip(`Open http://localhost:${l.port} (${l.cmd})`)
      .on_click(() => openUrl(l.port))
      .child(`:${l.port} ${l.cmd}`)));
}

const iconButton = (t, id, icon, tip, color, onClick) => div().id(id).size(22).rounded(5).flex().items_center().justify_center()
  .cursor_pointer().text_color(t.dim).hover((s) => s.bg(t.hover).text_color(color)).tooltip(tip).on_click(onClick)
  .child(svg(icon).size(12));

function serverRow(t, l, { canStop }) {
  return h_flex().h(28).gap(10).items_center()
    .child(div().w(52).flex_none().font_family(MONO).text_size(12).text_color(t.ansi2).child(`:${l.port}`))
    .child(div().flex_1().min_w(0).truncate().text_size(12).text_color(t.foreground).child(l.cmd))
    .child(div().font_family(MONO).text_size(9.5).text_color(t.dim).child(l.terminal ?? `pid ${l.pid}`))
    .child(iconButton(t, `open-${l.pid}-${l.port}`, "mods/halo/icons/next.svg", `Open http://localhost:${l.port}`, t.accent, () => openUrl(l.port)))
    .when(canStop, (el) => el.child(iconButton(t, `stop-${l.pid}-${l.port}`, "mods/workspace-chrome/x.svg", `Stop ${l.cmd} (SIGTERM pid ${l.pid})`, t.blocked, () => stop(l.pid))));
}

// DEV › SERVERS for the shown space.
export function serversSection(t) {
  const space = spaces().find((s) => s.active);
  const list = space ? serversOf(space.id) : [];
  if (!list.length) return null;
  return {
    summary: list.map((l) => `:${l.port}`).join(" "),
    summaryColor: t.ansi2,
    body: v_flex().gap(1).children(list.map((l) => serverRow(t, l, { canStop: true }))),
  };
}

// DEV › OTHER APPS: dev ports answered by something outside every space.
export function foreignSection(t) {
  const list = shared("halo.servers")?.foreign ?? [];
  if (!list.length) return null;
  return {
    summary: `${list.length} on dev ports`,
    summaryColor: t.ansi3,
    body: v_flex().gap(4)
      .child(div().font_family(MONO).text_size(9.5).text_color(t.ansi3)
        .child("NOT STARTED FROM HERDR · a check against these ports may hit the wrong app"))
      .children(list.map((l) => serverRow(t, l, { canStop: true }))),
  };
}
