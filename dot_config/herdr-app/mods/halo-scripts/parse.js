// Pure helpers for the script palette (halo-scripts), free of herdr imports so bun can test them.

export function parseMakefile(text) {
  const out = [];
  for (const m of (text ?? "").matchAll(/^([A-Za-z0-9][A-Za-z0-9_.-]*)\s*:(?![=:])/gm)) {
    if (!out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

export function parseJustfile(text) {
  const out = [];
  for (const m of (text ?? "").matchAll(/^@?([A-Za-z0-9_-]+)(?:\s+[^:\n]*)?:(?!=)/gm)) {
    if (!["set", "alias", "export", "import", "mod"].includes(m[1]) && !out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

// Characters of the query in order, anywhere in the text ("tsc" matches "typecheck").
export function fuzzy(text, query) {
  let i = 0;
  const t = text.toLowerCase();
  for (const ch of query.toLowerCase()) {
    i = t.indexOf(ch, i);
    if (i < 0) return false;
    i += 1;
  }
  return true;
}
