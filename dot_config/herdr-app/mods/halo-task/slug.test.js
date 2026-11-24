// bun test mods/halo-task/slug.test.js
import { expect, test } from "bun:test";
import { slugify, expandHome } from "./slug.js";

test("slug matches wt", () => {
  expect(slugify("Fix Login: SSO redirect!")).toBe("fix-login-sso-redirect");
  expect(slugify("  --  ")).toBe("");
});

test("home expansion", () => {
  expect(expandHome("~/.herdr/worktrees", "/Users/x")).toBe("/Users/x/.herdr/worktrees");
  expect(expandHome("/abs", "/Users/x")).toBe("/abs");
});
