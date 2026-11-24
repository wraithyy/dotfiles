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
