// bun test mods/halo-scripts/parse.test.js
import { expect, test } from "bun:test";
import { parseMakefile, parseJustfile, fuzzy } from "./parse.js";

test("makefile targets, not variables or special targets", () => {
  const mk = ".PHONY: build\nCC := gcc\nVERSION ?= 1\nbuild: deps\n\tgo build\ndeps:\n\tgo mod download\ntest-unit: build\n";
  expect(parseMakefile(mk)).toEqual(["build", "deps", "test-unit"]);
});

test("justfile recipes with params, skipping settings and aliases", () => {
  const jf = "set shell := [\"zsh\", \"-c\"]\nalias b := build\nbuild:\n  cargo build\ntest filter='':\n  cargo test {{filter}}\n@fmt:\n  cargo fmt\n";
  expect(parseJustfile(jf)).toEqual(["build", "test", "fmt"]);
});

test("fuzzy matches characters in order", () => {
  expect(fuzzy("pnpm typecheck", "tc")).toBe(true);
  expect(fuzzy("pnpm dev", "dv")).toBe(true);
  expect(fuzzy("pnpm dev", "vd")).toBe(false);
});
