// Pure helpers for the new-space picker, free of herdr imports so bun can test them.

// Characters of the query in order, anywhere in the text ("hlo" matches "halo").
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

// Waypoints first (named by the user), then repos; one entry per folder.
export function merge(waypoints, repos, home) {
  const seen = new Set();
  const out = [];
  const short = (p) => (p.startsWith(home) ? `~${p.slice(home.length)}` : p);
  for (const w of waypoints) {
    if (seen.has(w.path)) continue;
    seen.add(w.path);
    out.push({ kind: "waypoint", name: w.name, path: w.path, label: short(w.path) });
  }
  for (const path of repos) {
    if (seen.has(path)) continue;
    seen.add(path);
    out.push({ kind: "repo", name: path.split("/").pop(), path, label: short(path) });
  }
  return out;
}

export function parseWaypoints(text) {
  return (text ?? "").split("\n").map((l) => l.split("\t")).filter(([n, p]) => n && p).map(([name, path]) => ({ name, path }));
}

// A typed path ("~/x" or "/x") is offered as-is so any folder works without the list.
export function typedPath(query, home) {
  const q = query.trim();
  if (q.startsWith("~/") || q === "~") return `${home}${q.slice(1)}`;
  return q.startsWith("/") ? q : null;
}

// Lower is better; null = no match. Name before path (label is already "~/…").
export function score(item, query) {
  const q = query.toLowerCase();
  const name = item.name.toLowerCase();
  const label = item.label.toLowerCase();
  if (name.startsWith(q)) return 0;
  if (name.includes(q)) return 1;
  if (fuzzy(name, q)) return 2;
  if (label.includes(q)) return 3;
  if (fuzzy(label, q)) return 4;
  return null;
}
