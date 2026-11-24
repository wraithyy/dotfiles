// AGENT › CHANGES: a one-line summary of the focused agent's working tree (git diff
// against HEAD plus untracked files); clicking opens Herdr's Changes panel. Fetched by
// the dock copy; refreshed when the agent finishes work, on folder change, every 20 s.

import { exec, run } from "herdr";
import { parseChanges } from "./parse.js";

const STALE_MS = 20000;

// Local terminals only: a remote terminal's cwd means nothing to the local git.
export const agentFolder = (term) => (term?.address?.includes("/") ? null : term?.foreground?.cwd ?? term?.cwd ?? null);

export function needsRefresh(view, term) {
  const folder = agentFolder(term);
  if (!folder) return false;
  const cached = view.changes?.[folder];
  const statusFlip = view.changesStatus?.[term.address] === "working" && term.status !== "working";
  return !cached || statusFlip || Date.now() - cached.at > STALE_MS;
}

export async function refreshChanges(view, term) {
  const folder = agentFolder(term);
  if (!folder) return;
  view.changesStatus = { ...view.changesStatus, [term.address]: term.status };
  // Mark first so overlapping renders don't start a second fetch for the same folder.
  view.changes = { ...view.changes, [folder]: { ...(view.changes?.[folder] ?? { files: [] }), at: Date.now() } };
  try {
    const [numstat, status] = await Promise.all([
      // --no-optional-locks: never take index.lock while the agent may be committing.
      exec("git", ["--no-optional-locks", "-C", folder, "diff", "HEAD", "--numstat"], { timeout: 5000 }),
      exec("git", ["--no-optional-locks", "-C", folder, "status", "--porcelain=v1", "--untracked-files=normal"], { timeout: 5000 }),
    ]);
    const root = (await exec("git", ["-C", folder, "rev-parse", "--show-toplevel"], { timeout: 5000 })).stdout.trim();
    view.changes = { ...view.changes, [folder]: { at: Date.now(), root, files: parseChanges(numstat.stdout, status.stdout) } };
  } catch {
    view.changes = { ...view.changes, [folder]: { at: Date.now(), root: null, files: [], error: "not a git repo" } };
  }
}

export function changesSection(t, view, term) {
  const data = view?.changes?.[agentFolder(term)];
  if (!data || data.error) return null;
  const files = data.files;
  const add = files.reduce((n, f) => n + f.add, 0);
  const del = files.reduce((n, f) => n + f.del, 0);
  // One line only; Herdr's own Changes panel is the full view.
  return {
    summary: files.length ? `${files.length} files +${add} −${del}` : "clean",
    summaryColor: files.length ? t.ansi3 : null,
    tooltip: "Open the Changes panel",
    onOpen: () => { run("layout.select", { stack: "side-body", child: "changes" }); run("layout.show", { id: "side" }); },
  };
}
