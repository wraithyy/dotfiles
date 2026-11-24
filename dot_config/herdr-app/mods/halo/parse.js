// Pure helpers for halo, free of herdr imports so bun can test them.

// numstat lines are "added<TAB>removed<TAB>path"; binary files report "-".
export function parseChanges(numstat, porcelain) {
  const files = new Map();
  for (const line of (numstat ?? "").split("\n")) {
    const [add, del, ...rest] = line.split("\t");
    const path = rest.join("\t");
    if (!path) continue;
    files.set(path, { path, add: add === "-" ? 0 : Number(add) || 0, del: del === "-" ? 0 : Number(del) || 0, kind: "M" });
  }
  for (const line of (porcelain ?? "").split("\n")) {
    if (line.startsWith("?? ")) {
      const path = line.slice(3);
      files.set(path, { path, add: 0, del: 0, kind: "?" });
    } else if (line.length > 3 && (line[0] === "D" || line[1] === "D")) {
      const path = line.slice(3);
      if (files.has(path)) files.set(path, { ...files.get(path), kind: "D" });
    }
  }
  return [...files.values()].sort((a, b) => b.add + b.del - (a.add + a.del));
}
