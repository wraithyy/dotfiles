// bun test mods/halo-space/rank.test.js
import { expect, test } from "bun:test";
import { fuzzy, merge, parseWaypoints, typedPath, score } from "./rank.js";

test("waypoints win over the same repo, labels shortened", () => {
  const wps = parseWaypoints("chezmoi\t/h/.local/share/chezmoi\nbad line\n");
  const list = merge(wps, ["/h/.local/share/chezmoi", "/h/Development/halo"], "/h");
  expect(list.map((x) => [x.kind, x.name, x.label])).toEqual([
    ["waypoint", "chezmoi", "~/.local/share/chezmoi"],
    ["repo", "halo", "~/Development/halo"],
  ]);
});

test("typed paths and fuzzy", () => {
  expect(typedPath("~/Development", "/h")).toBe("/h/Development");
  expect(typedPath("/tmp", "/h")).toBe("/tmp");
  expect(typedPath("halo", "/h")).toBe(null);
  expect(fuzzy("~/Development/acme/storefront", "acstf")).toBe(true);
});

test("name matches rank before path matches", () => {
  const sweet = { name: "Storefront", label: "~/Development/acme/storefront" };
  const portal = { name: "Acme-Portal", label: "~/Development/acme/portal" };
  expect(score(portal, "acme")).toBe(0);
  expect(score(sweet, "acme")).toBe(3);
  expect(score(sweet, "zzz")).toBe(null);
});
