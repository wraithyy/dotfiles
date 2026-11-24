// New task (dialog, mod.open:halo-task): a task name and a prompt become a git worktree
// on branch task/<slug>, opened as a new space with Claude given the prompt as its first
// message. The repo is the focused pane's; worktrees go where settings.json says.

import { View, div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { exec, run, theme, props, closeOverlay, focused, spaces, settings, home } from "herdr";
import { slugify, expandHome } from "./slug.js";

const MONO = "JetBrainsMono Nerd Font Mono";

export default class HaloTask extends View {
  init(_props, cx) {
    this.folder = focused()?.cwd ?? spaces().find((s) => s.active)?.folder ?? null;
    this.repo = null;
    this.error = null;
    this.busy = false;
    this.field = "name";
    this.name = InputState.new({ placeholder: "Task name, e.g. fix login redirect" });
    this.prompt = InputState.new({ placeholder: "What should Claude do? (Enter creates)" });
    this.name.on("change", (_e, cx) => cx.notify());
    this.name.on("submit", (_e, cx) => { this.field = "prompt"; this.prompt.focus(); cx.notify(); });
    this.prompt.on("submit", (_e, cx) => this.create(cx));
    this.name.focus();
    cx.timer.after(600, () => (this.field === "name" ? this.name : this.prompt).focus());
    this.handle = cx.focus_handle();
    cx.spawn(async (cx) => {
      if (!this.folder) return;
      const r = await exec("git", ["-C", this.folder, "rev-parse", "--show-toplevel"], { timeout: 5000 }).catch(() => null);
      this.repo = r?.code === 0 ? r.stdout.trim() : null;
      if (!this.repo) this.error = "The focused pane is not in a git repo.";
      cx.notify();
    });
  }

  close() { closeOverlay(props().overlay); }

  create(cx) {
    const slug = slugify(this.name.value());
    const prompt = this.prompt.value().trim();
    if (!this.repo || !slug || this.busy) {
      this.error = !slug ? "Give the task a name." : this.error;
      cx.notify();
      return;
    }
    this.busy = true;
    this.error = null;
    cx.spawn(async (cx) => {
      const base = expandHome(String(settings()?.worktrees?.directory ?? "~/.herdr/worktrees"), home());
      const path = `${base}/${this.repo.split("/").pop()}/task-${slug}`;
      const branch = `task/${slug}`;
      const exists = await exec("git", ["-C", this.repo, "show-ref", "--verify", "--quiet", `refs/heads/${branch}`]).catch(() => null);
      const args = exists?.code === 0 ? ["worktree", "add", path, branch] : ["worktree", "add", "-b", branch, path];
      const r = await exec("git", ["-C", this.repo, ...args], { timeout: 30000 }).catch((e) => ({ code: 1, stderr: String(e) }));
      if (r.code !== 0) {
        this.busy = false;
        this.error = (r.stderr || "git worktree add failed").trim().split("\n").pop();
        cx.notify();
        return;
      }
      this.close();
      run("space.new", { folder: path, argv: ["claude"], ...(prompt ? { task: prompt } : {}) });
    });
  }

  render() {
    const t = theme();
    const slug = slugify(this.name.value());
    const field = (state, active) => h_flex().h(38).flex_none().px(10).items_center().rounded(8).border(1)
      .border_color(active ? t.accent : t.border).bg(t.background)
      .child(Input.new(state).flex_1().h_full().text_size(13).text_color(t.foreground));
    return v_flex().id("halo-task").track_focus(this.handle).size_full().p(18).gap(12).bg(t.popover)
      .on_key_down((e, cx) => {
        if (e.key === "escape") return this.close();
        if (e.key !== "tab") return;
        this.field = this.field === "name" ? "prompt" : "name";
        (this.field === "name" ? this.name : this.prompt).focus();
        cx.stop_propagation();
        cx.notify();
      })
      .child(h_flex().gap(8).items_center()
        .child(div().w(2).h(12).bg(t.accent))
        .child(div().font_family(MONO).text_size(11).font_semibold().text_color(t.accent).child("NEW TASK"))
        .child(div().flex_1().min_w(0).truncate().font_family(MONO).text_size(10).text_color(t.dim).child(this.repo ?? this.folder ?? ""))
        .child(div().font_family(MONO).text_size(9.5).text_color(t.dim).child("tab field · enter next/create · esc")))
      .child(field(this.name, this.field === "name"))
      .child(field(this.prompt, this.field === "prompt"))
      .child(div().font_family(MONO).text_size(10).text_color(t.dim)
        .child(slug ? `worktree on branch task/${slug} → new space with Claude` : "worktree + space + Claude, in one step"))
      .when(Boolean(this.error), (el) => el.child(div().text_size(12).text_color(t.blocked).child(this.error)))
      .when(this.busy, (el) => el.child(div().font_family(MONO).text_size(10).text_color(t.working).child("CREATING WORKTREE…")));
  }
}
