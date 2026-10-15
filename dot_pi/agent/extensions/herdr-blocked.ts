/**
 * Marks the herdr pane as "blocked" (waiting on me) while any pi dialog is open:
 * ask_user_question, permission asks, plan-mode questions. herdr's own pi
 * integration (herdr-agent-state.ts) listens for "herdr:blocked" but nothing
 * in pi emits it by default.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	pi.on("ui_prompt_start", (event) => {
		pi.events.emit("herdr:blocked", { active: true, label: event.title ?? "Waiting for input" });
	});
	pi.on("ui_prompt_end", () => {
		pi.events.emit("herdr:blocked", { active: false });
	});
}
