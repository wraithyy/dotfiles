// bun test mods/halo/parse.test.js
import { expect, test } from "bun:test";
import { parseChanges } from "./parse.js";

test("changes merge numstat with untracked and deleted files, biggest first", () => {
  const numstat = "3\t1\tsrc/a.ts\n40\t0\tsrc/big.ts\n-\t-\tlogo.png\n0\t12\told.ts\n";
  const porcelain = " M src/a.ts\n?? notes.md\n D old.ts\n";
  expect(parseChanges(numstat, porcelain)).toEqual([
    { path: "src/big.ts", add: 40, del: 0, kind: "M" },
    { path: "old.ts", add: 0, del: 12, kind: "D" },
    { path: "src/a.ts", add: 3, del: 1, kind: "M" },
    { path: "logo.png", add: 0, del: 0, kind: "M" },
    { path: "notes.md", add: 0, del: 0, kind: "?" },
  ]);
});

import { parseListeners, parseParents, attribute } from "./parse.js";

test("listeners are parsed, deduped per pid and port, sorted", () => {
  const lsof = "p707\ncControlCenter\nf10\nn*:7000\nf11\nn*:7000\nf12\nn*:5000\np900\ncnode\nf20\nn127.0.0.1:5173\nf21\nn[::1]:5173\n";
  expect(parseListeners(lsof)).toEqual([
    { pid: 707, cmd: "ControlCenter", port: 5000 },
    { pid: 900, cmd: "node", port: 5173 },
    { pid: 707, cmd: "ControlCenter", port: 7000 },
  ]);
});

test("a server is owned by the space of the terminal up its parent chain", () => {
  const parents = parseParents("  900   850\n  850   800\n  800     1\n  950     1\n  707     1\n");
  const owners = new Map([[800, { terminal: "t5", space: "spA" }]]);
  const listeners = [
    { pid: 900, cmd: "node", port: 5173 },
    { pid: 950, cmd: "next-server", port: 3000 },
    { pid: 707, cmd: "ControlCenter", port: 5000 },
    { pid: 900, cmd: "2.1.331", port: 59255 },
  ];
  expect(attribute(listeners, parents, owners)).toEqual({
    bySpace: { spA: [{ pid: 900, cmd: "node", port: 5173, terminal: "t5" }] },
    foreign: [{ pid: 950, cmd: "next-server", port: 3000 }],
  });
});
