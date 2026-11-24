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

// `lsof -nP -iTCP -sTCP:LISTEN -Fpcn`: "p<pid>", "c<command>", then "n<addr>:<port>" per fd.
export function parseListeners(text) {
  const out = [];
  const seen = new Set();
  let pid = null;
  let cmd = "";
  for (const line of (text ?? "").split("\n")) {
    if (line.startsWith("p")) { pid = Number(line.slice(1)); cmd = ""; }
    else if (line.startsWith("c")) cmd = line.slice(1);
    else if (line.startsWith("n") && pid) {
      const port = Number(line.slice(line.lastIndexOf(":") + 1));
      const key = `${pid}:${port}`;
      if (port && !seen.has(key)) { seen.add(key); out.push({ pid, cmd, port }); }
    }
  }
  return out.sort((a, b) => a.port - b.port);
}

// `ps -Ao pid=,ppid=` -> Map pid -> ppid.
export function parseParents(text) {
  const parents = new Map();
  for (const line of (text ?? "").split("\n")) {
    const [pid, ppid] = line.trim().split(/\s+/).map(Number);
    if (pid) parents.set(pid, ppid);
  }
  return parents;
}

// Ports dev servers usually take; a listener there outside every space is worth a warning
// (another app answering on :3000 is how a check "passes" against the wrong server).
// Ephemeral range: tools (Claude Code's IDE bridge, browsers) listen there, dev servers don't.
export const EPHEMERAL_FROM = 49152;

export const DEV_PORTS = new Set([3000, 3001, 3002, 3003, 4000, 4200, 4321, 5173, 5174, 6006, 8000, 8080, 8081, 8888, 9000]);

// owners: Map terminal pid -> { terminal, space }. Walks each listener's parent chain to
// the shell of a herdr terminal. Returns { bySpace: {space: [listener]}, foreign: [listener] }.
export function attribute(listeners, parents, owners) {
  const bySpace = {};
  const foreign = [];
  for (const l of listeners) {
    if (l.port >= EPHEMERAL_FROM) continue;
    let pid = l.pid;
    let owner = null;
    for (let hops = 0; pid && hops < 64 && !owner; hops++) {
      owner = owners.get(pid) ?? null;
      pid = parents.get(pid);
    }
    if (owner?.space) (bySpace[owner.space] ??= []).push({ ...l, terminal: owner.terminal });
    else if (DEV_PORTS.has(l.port)) foreign.push(l);
  }
  return { bySpace, foreign };
}
