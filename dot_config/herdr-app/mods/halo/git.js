// GIT: merge requests / pull requests and pipelines through the user's own glab and gh
// logins (no tokens here). The tab bar copy polls every 60 s and publishes
// shared("halo.git"); the dev dock and the tree read it. Network failures (VPN off) are
// stored as errors and shown dim, never as toasts.

import { div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { exec, run, spaces, panes, shared, setShared, notify } from "herdr";
import { MONO, openMenu } from "./lib.js";
import { parseRemote, providerOf, pipelineFinished, rollupStatus, loggedInHosts, groupByProject } from "./parse.js";

export const GIT_POLL_MS = 60000;
const TIMEOUT = { timeout: 8000 };

const json = (r) => { try { return r?.code === 0 ? JSON.parse(r.stdout) : null; } catch { return null; } };
// null when the command failed (cannot start, non-zero exit: VPN off, no auth).
const run_ = async (cmd, args, cwd) => {
  const r = await exec(cmd, args, { ...TIMEOUT, cwd }).catch(() => null);
  return r?.code === 0 ? r : null;
};

function shapeMr(m) {
  return {
    id: `!${m.iid}`, ref: m.references?.full ?? `!${m.iid}`, title: m.title, url: m.web_url,
    branch: m.source_branch, status: m.detailed_merge_status ?? m.merge_status, draft: Boolean(m.draft),
    notes: m.user_notes_count ?? 0,
  };
}

async function gitlabSpace(folder, remote, branch) {
  const project = encodeURIComponent(remote.path);
  const host = ["--hostname", remote.host];
  const [mrs, pipes] = await Promise.all([
    run_("glab", ["api", ...host, `projects/${project}/merge_requests?state=opened&source_branch=${encodeURIComponent(branch)}`], folder),
    run_("glab", ["api", ...host, `projects/${project}/pipelines?ref=${encodeURIComponent(branch)}&per_page=1`], folder),
  ]);
  if (!mrs && !pipes) return { error: "gitlab unreachable" };
  const mr = json(mrs)?.[0];
  const p = json(pipes)?.[0];
  return { mr: mr ? shapeMr(mr) : null, pipeline: p ? { status: p.status, url: p.web_url } : null };
}

async function githubSpace(folder) {
  const r = await exec("gh", ["pr", "view", "--json", "number,title,url,isDraft,reviewDecision,statusCheckRollup,headRefName"], { ...TIMEOUT, cwd: folder }).catch(() => null);
  if (!r) return { error: "github unreachable" };
  // gh exits non-zero both offline and when the branch has no PR; only the latter says so.
  if (r.code !== 0) return /no pull requests found/i.test(r.stderr) ? { mr: null, pipeline: null } : { error: "github unreachable" };
  const pr = json(r);
  if (!pr) return { mr: null, pipeline: null };
  return {
    mr: { id: `#${pr.number}`, ref: `#${pr.number}`, title: pr.title, url: pr.url, branch: pr.headRefName,
      status: (pr.reviewDecision || "").toLowerCase().replace(/_/g, " ") || "open", draft: pr.isDraft, notes: 0 },
    pipeline: { status: rollupStatus(pr.statusCheckRollup), url: pr.url },
  };
}

// A space's own folder is where its first terminal started (often ~); its panes' live
// folders say where the work is. Active tab first, focused pane first.
function candidateFolders(s, all) {
  const order = [...(s.tabs ?? [])].sort((a, b) => Number(b.active) - Number(a.active)).map((tab) => tab.id);
  const mine = all.filter((p) => order.includes(p.tab) && p.cwd)
    .sort((a, b) => order.indexOf(a.tab) - order.indexOf(b.tab) || Number(b.focused) - Number(a.focused));
  return [...new Set([...mine.map((p) => p.cwd), s.folder].filter(Boolean))].slice(0, 4);
}

async function repoOf(s, all) {
  for (const folder of candidateFolders(s, all)) {
    const r = await run_("git", ["-C", folder, "remote", "get-url", "origin"]);
    if (r?.code === 0) return { folder, remoteR: r };
  }
  return null;
}

async function spaceInfo(s, all) {
  if (s.machine) return null;
  const found = await repoOf(s, all);
  if (!found) return null;
  const { folder, remoteR } = found;
  const branchR = await run_("git", ["-C", folder, "branch", "--show-current"]);
  const remote = parseRemote(remoteR?.stdout);
  const branch = branchR?.stdout.trim();
  const provider = providerOf(remote?.host);
  if (!remote || !branch || !provider) return null;
  const info = provider === "gitlab" ? await gitlabSpace(folder, remote, branch) : await githubSpace(folder);
  return { provider, host: remote.host, repo: remote.path, branch, ...info };
}

async function queues(gitlabHost, previous) {
  if (!gitlabHost) return { reviews: [], mine: [] };
  const host = ["--hostname", gitlabHost];
  const user = json(await run_("glab", ["api", ...host, "user"]))?.username;
  const [reviews, mine] = await Promise.all([
    user ? run_("glab", ["api", ...host, `merge_requests?reviewer_username=${user}&state=opened&scope=all&per_page=20`]) : null,
    run_("glab", ["api", ...host, "merge_requests?scope=created_by_me&state=opened&per_page=20"]),
  ]);
  // Offline: keep the last good lists instead of wiping them.
  return {
    reviews: reviews ? (json(reviews) ?? []).map(shapeMr) : previous?.reviews ?? [],
    mine: mine ? (json(mine) ?? []).map(shapeMr) : previous?.mine ?? [],
  };
}

let polling = false;
let authHost = null; // glab's logged-in host, asked once

export async function pollGit() {
  if (polling) return;
  polling = true;
  try { await pollGitOnce(); } finally { polling = false; }
}

async function pollGitOnce() {
  const list = spaces();
  const all = panes();
  const results = await Promise.all(list.map((s) => spaceInfo(s, all).catch(() => null)));
  const bySpace = {};
  list.forEach((s, i) => { if (results[i]) bySpace[s.id] = results[i]; });
  let gitlabHost = Object.values(bySpace).find((x) => x.provider === "gitlab" && !x.error)?.host;
  if (!gitlabHost) {
    // glab prints auth status on stderr; the default host need not be the logged-in one.
    if (authHost === null) {
      const auth = await exec("glab", ["auth", "status"], TIMEOUT).catch(() => null);
      authHost = loggedInHosts(`${auth?.stdout ?? ""}${auth?.stderr ?? ""}`)[0] ?? "";
    }
    gitlabHost = authHost || undefined;
  }
  const before = shared("halo.git") ?? {};
  const next = { bySpace, ...(await queues(gitlabHost, before)) };
  const toasted = new Set();
  for (const [id, info] of Object.entries(bySpace)) {
    const was = before.bySpace?.[id]?.pipeline?.status;
    const now = info.pipeline?.status;
    // Several spaces on one repo and branch share a pipeline: one toast.
    const key = `${info.repo}@${info.branch}`;
    if (pipelineFinished(was, now) && !toasted.has(key)) {
      toasted.add(key);
      const ok = now === "success";
      notify({ title: `Pipeline ${ok ? "passed" : now}`, body: `${info.repo.split("/").pop()} · ${info.branch}`,
        level: ok ? "success" : "error", timeout: ok ? 5000 : 15000 });
    }
  }
  if (JSON.stringify(next) !== JSON.stringify(before)) setShared("halo.git", next);
}

const PIPE_COLOR = (t, s) => ({ success: t.done, failed: t.blocked, canceled: t.dim, skipped: t.dim, manual: t.ansi3 }[s] ?? t.working);
const openUrl = (url) => exec("open", [url]).catch(() => null);

export function gitOf(spaceId) {
  return shared("halo.git")?.bySpace?.[spaceId] ?? null;
}

// Tree: "!23 ● failed" under the space's agents.
export function treeGitRow(t, spaceId) {
  const g = gitOf(spaceId);
  if (!g || g.error || (!g.mr && !g.pipeline?.status)) return null;
  const status = g.pipeline?.status;
  return h_flex().id(`git-${spaceId}`).ml(13).pl(10).pr(8).py(3).gap(6).items_center().border_l(1).border_color(t.border).cursor_pointer()
    .hover((s) => s.bg(t.hover)).tooltip(g.mr ? `${g.mr.ref}: ${g.mr.title}` : `pipeline ${status} on ${g.branch}`)
    .on_click(() => openUrl(g.mr?.url ?? g.pipeline.url))
    .child(svg("mods/workspace-chrome/git-branch.svg").size(11).text_color(t.muted))
    .when(Boolean(g.mr), (el) => el.child(div().font_family(MONO).text_size(9.5).text_color(t.foreground).child(g.mr.id)))
    .when(Boolean(status), (el) => el.child(div().size(6).rounded(3).bg(PIPE_COLOR(t, status)))
      .child(div().font_family(MONO).text_size(9.5).text_color(PIPE_COLOR(t, status)).child(status)));
}

const smallButton = (t, id, label, onClick) => div().id(id).h(22).px(8).rounded(5).flex().items_center().cursor_pointer()
  .border(1).border_color(t.border).font_family(MONO).text_size(9.5).text_color(t.muted)
  .hover((s) => s.bg(t.hover).text_color(t.accent)).on_click(onClick).child(label);

function mrRow(t, mr, key) {
  return h_flex().id(`${key}-${mr.ref}`).h(26).ml(14).pl(8).gap(8).items_center().rounded(4).cursor_pointer()
    .border_l(1).border_color(t.border)
    .hover((s) => s.bg(t.hover)).tooltip(`Open ${mr.ref}`).on_click(() => openUrl(mr.url))
    .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); openMenu("mr", { id: mr.id, url: mr.url }); })
    .child(div().w(48).flex_none().font_family(MONO).text_size(10).text_color(t.accent).child(mr.id))
    .child(div().flex_1().min_w(0).truncate().text_size(12).text_color(mr.draft ? t.dim : t.foreground).child(mr.title))
    .when(mr.draft, (el) => el.child(div().flex_none().font_family(MONO).text_size(9).text_color(t.dim).child("DRAFT")));
}

// One block per project: a bold name with its group path, then its MRs.
function byProject(t, list, key) {
  return v_flex().gap(8).children(groupByProject(list).map((g) => v_flex().gap(2)
    .child(h_flex().h(22).gap(7).items_center()
      .child(svg("mods/workspace-chrome/folder.svg").size(12).flex_none().text_color(t.accent))
      .child(div().flex_none().text_size(12.5).font_semibold().text_color(t.foreground).child(g.name))
      .child(div().flex_1().min_w(0).truncate().font_family(MONO).text_size(9.5).text_color(t.dim).child(g.parent))
      .child(div().flex_none().font_family(MONO).text_size(9.5).text_color(t.muted).child(String(g.items.length))))
    .children(g.items.map((mr) => mrRow(t, mr, key)))));
}

// GIT › MR of the shown space.
export function mrSection(t) {
  const space = spaces().find((s) => s.active);
  const g = space ? gitOf(space.id) : null;
  if (!g) return null;
  if (g.error) return { summary: "offline", body: div().font_family(MONO).text_size(10).text_color(t.dim).child(`${g.error.toUpperCase()} · VPN?`) };
  const status = g.pipeline?.status;
  const body = v_flex().gap(8)
    .child(h_flex().gap(8).items_center()
      .child(svg("mods/workspace-chrome/git-branch.svg").size(12).text_color(t.muted))
      .child(div().font_family(MONO).text_size(10.5).text_color(t.foreground).child(g.branch))
      .child(div().flex_1())
      .when(Boolean(status), (el) => el.child(div().id("pipe-open").flex().items_center().gap(6).cursor_pointer()
        .on_click(() => openUrl(g.pipeline.url))
        .child(div().size(7).rounded(4).bg(PIPE_COLOR(t, status)))
        .child(div().font_family(MONO).text_size(10).text_color(PIPE_COLOR(t, status)).child(`PIPELINE ${status.toUpperCase()}`)))))
    .child(g.mr
      ? v_flex().gap(6)
        .child(div().text_size(13).font_medium().text_color(t.foreground).child(`${g.mr.id} ${g.mr.title}`))
        .child(h_flex().gap(8).items_center()
          .child(div().font_family(MONO).text_size(9.5).text_color(g.mr.status === "mergeable" ? t.done : t.ansi3).child(g.mr.status ?? ""))
          .when(g.mr.draft, (el) => el.child(div().font_family(MONO).text_size(9.5).text_color(t.dim).child("DRAFT")))
          .when(g.mr.notes > 0, (el) => el.child(div().font_family(MONO).text_size(9.5).text_color(t.dim).child(`${g.mr.notes} notes`)))
          .child(div().flex_1())
          .child(smallButton(t, "mr-open", "OPEN", () => openUrl(g.mr.url)))
          .child(smallButton(t, "mr-review", "REVIEW WITH CLAUDE", () => run("tab.new",
            { argv: ["claude"], name: `review ${g.mr.id}`, task: `Review this merge request and report findings: ${g.mr.url}` }))))
      : div().font_family(MONO).text_size(10).text_color(t.dim).child(`NO OPEN ${g.provider === "github" ? "PR" : "MR"} FOR THIS BRANCH`));
  return { summary: g.mr ? `${g.mr.id}${status ? ` · ${status}` : ""}` : status ?? "no MR", summaryColor: status ? PIPE_COLOR(t, status) : null, body };
}

export function reviewsSection(t) {
  const list = shared("halo.git")?.reviews ?? [];
  if (!list.length) return null;
  return { summary: `${list.length} to review`, summaryColor: t.ansi3, body: byProject(t, list, "rev") };
}

export function mineSection(t) {
  const list = shared("halo.git")?.mine ?? [];
  if (!list.length) return null;
  return { summary: `${list.length} open`, body: byProject(t, list, "mine") };
}
