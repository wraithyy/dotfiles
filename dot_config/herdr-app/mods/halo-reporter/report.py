#!/usr/bin/env python3
"""Publish Claude Code session facts as herdr terminal labels for the halo layout.

  report.py hook               Claude Code hook; reads the hook payload on stdin
  report.py statusline <file>  statusline JSON already written to <file>

Both exit quietly outside herdr (no HC_TERMINAL_ID). The hook parses the transcript
incrementally (byte offset + accumulators in ~/.cache/halo/<session>.json) and writes
halo.context / halo.activity / halo.cache; the statusline writes halo.status.
Stdlib only: it runs on every tool call.
"""

import fcntl
import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime

CHARS_PER_TOKEN = 3.5
ACTIVITY_MAX = 40
MISSES_MAX = 12
MIN_LOST = 1024  # tokens; smaller drops are noise, not a cache miss
TEXT_MAX = 120
STATE_DIR = os.path.expanduser("~/.cache/halo")
STATE_VERSION = 1  # bump when the state shape changes; old files are rebuilt from the transcript
READ_CHUNK = 8 * 1024 * 1024  # per run, so a huge resumed transcript makes progress inside the hook timeout
CATEGORIES = ("system", "tools", "mcp", "skills", "agents", "memory", "messages")

MEMORY_ATTACHMENTS = {"instructions", "nested_memory", "claude_md", "memory",
                      "hook_success", "hook_additional_context", "session_context", "environment"}
SKILL_ATTACHMENTS = {"skill_listing", "invoked_skills"}
AGENT_ATTACHMENTS = {"agent_listing_delta"}
MCP_ATTACHMENTS = {"mcp_instructions_delta", "mcp_resource"}
TOOL_ATTACHMENTS = {"deferred_tools_delta", "deferred_tools_record"}
# Transcript bookkeeping that is never sent to the model.
SKIP_ATTACHMENTS = {"prompt_snapshot"}

KIND = {
    "Read": "read", "NotebookRead": "read",
    "Edit": "edit", "Write": "edit", "MultiEdit": "edit", "NotebookEdit": "edit",
    "Bash": "run", "BashOutput": "run",
    "Grep": "search", "Glob": "search", "WebSearch": "search", "WebFetch": "search", "ToolSearch": "search",
    "Agent": "agent", "Task": "agent",
    "Skill": "skill",
}


def clip(s, n=TEXT_MAX):
    s = " ".join(str(s or "").split())
    return s if len(s) <= n else s[: n - 1] + "…"


IMAGE_TOKENS = 1600  # images are billed by size, not by their base64 length


def tokens(obj):
    if isinstance(obj, list):
        return sum(IMAGE_TOKENS if isinstance(b, dict) and b.get("type") == "image" else tokens(b) for b in obj)
    if isinstance(obj, dict) and obj.get("type") == "image":
        return IMAGE_TOKENS
    if isinstance(obj, dict) and obj.get("type") == "text":
        return tokens(obj.get("text", ""))
    text = obj if isinstance(obj, str) else json.dumps(obj, ensure_ascii=False)
    return len(text) / CHARS_PER_TOKEN


def epoch(ts):
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp()
    except (AttributeError, ValueError):
        return None


def tool_category(name):
    if name.startswith("mcp__"):
        return "mcp"
    if name == "Skill":
        return "skills"
    if name in ("Agent", "Task"):
        return "agents"
    return "tools"


def detail(name, inp):
    inp = inp if isinstance(inp, dict) else {}
    for key in ("description", "file_path", "command", "pattern", "query", "url", "skill", "prompt"):
        if inp.get(key):
            value = inp[key]
            if key == "file_path":
                value = os.path.basename(value)
            return clip(value, 80)
    return ""


def fresh_state():
    return {
        "version": STATE_VERSION,
        "offset": 0,
        "cats": {c: 0.0 for c in CATEGORIES},
        "parts": {},  # "cat/name" -> estimated tokens, for the largest entries per category
        "shape": {"system": 0.0, "tools": 0.0, "mcp": 0.0, "parts": {}},
        "tool_names": {},  # tool_use id -> name, so results land in the caller's category
        "activity": [],
        "cache": {"read": 0, "write": 0, "uncached": 0, "misses": [], "last": None},
        "usage": None,
        "model": None,
        "compacts": [],
        "seen_msgs": [],
    }


def reset_context(state):
    state["cats"] = {c: 0.0 for c in CATEGORIES}
    state["parts"] = {}
    state["tool_names"] = {}


def add(state, cat, amount, part=None):
    state["cats"][cat] += amount
    if part:
        key = f"{cat}/{part}"
        state["parts"][key] = state["parts"].get(key, 0.0) + amount


def push_activity(state, entry):
    state["activity"].append(entry)
    del state["activity"][:-ACTIVITY_MAX]


def on_usage(state, rec, msg):
    mid = msg.get("id")
    if mid and mid in state["seen_msgs"]:
        return  # one API response is split over several records sharing its usage
    if mid:
        state["seen_msgs"] = (state["seen_msgs"] + [mid])[-50:]
    u = msg.get("usage") or {}
    read = u.get("cache_read_input_tokens", 0) or 0
    write = u.get("cache_creation_input_tokens", 0) or 0
    uncached = u.get("input_tokens", 0) or 0
    cc = u.get("cache_creation") or {}
    ttl = 3600 if cc.get("ephemeral_1h_input_tokens") else 300 if cc.get("ephemeral_5m_input_tokens") else None
    at = epoch(rec.get("timestamp"))
    model = msg.get("model")
    cache = state["cache"]
    cache["read"] += read
    cache["write"] += write
    cache["uncached"] += uncached
    last = cache["last"]
    if last:
        lost = last["read"] + last["write"] - read
        if lost >= MIN_LOST:
            cause = "unknown"
            if last.get("compacted"):
                cause = "compact"
            elif model and last.get("model") and model != last["model"]:
                cause = "model"
            elif at and last.get("at") and last.get("ttl") and at - last["at"] > last["ttl"]:
                cause = f"idle {round((at - last['at']) / 60)}m"
            cache["misses"].append({"at": at, "lost": lost, "cause": cause})
            del cache["misses"][:-MISSES_MAX]
    cache["last"] = {"read": read, "write": write, "at": at, "ttl": ttl or (last or {}).get("ttl"), "model": model}
    state["usage"] = {"input": uncached, "read": read, "write": write, "output": u.get("output_tokens", 0) or 0}
    state["model"] = model or state["model"]


def on_record(state, rec):
    kind = rec.get("type")
    at = epoch(rec.get("timestamp"))

    if kind == "system" and rec.get("subtype") == "compact_boundary":
        meta = rec.get("compactMetadata") or {}
        state["compacts"] = (state["compacts"] + [{"at": at, "pre": meta.get("preTokens"), "trigger": meta.get("trigger")}])[-5:]
        reset_context(state)
        if state["cache"]["last"]:
            state["cache"]["last"]["compacted"] = True
        return

    if kind == "api-request-shape":
        shape = rec.get("shape") or {}
        parts = {}
        tools = mcp = 0.0
        for tool in shape.get("tools") or []:
            name = tool.get("name", "?") if isinstance(tool, dict) else "?"
            size = tokens(tool)
            if name.startswith("mcp__"):
                mcp += size
                server = name.split("__")[1] if name.count("__") >= 2 else name
                parts[f"mcp/{server}"] = parts.get(f"mcp/{server}", 0.0) + size
            else:
                tools += size
                parts[f"tools/{name}"] = size
        state["shape"] = {"system": tokens(shape.get("system") or ""), "tools": tools, "mcp": mcp, "parts": parts}
        return

    if kind == "attachment":
        att = rec.get("attachment") or {}
        atype = att.get("type", "")
        size = tokens(att)
        if atype in SKIP_ATTACHMENTS:
            return
        if atype in MEMORY_ATTACHMENTS:
            add(state, "memory", size, "hooks" if atype.startswith("hook_") else atype)
        elif atype in TOOL_ATTACHMENTS:
            add(state, "tools", size, "deferred")
        elif atype in SKILL_ATTACHMENTS:
            add(state, "skills", size, atype)
        elif atype in AGENT_ATTACHMENTS:
            add(state, "agents", size, "listing")
        elif atype in MCP_ATTACHMENTS:
            add(state, "mcp", size, "instructions")
        else:
            add(state, "messages", size, "other")
        return

    if kind not in ("user", "assistant") or rec.get("isSidechain"):
        return
    msg = rec.get("message") or {}
    content = msg.get("content")

    if kind == "assistant":
        on_usage(state, rec, msg)

    if isinstance(content, str):
        add(state, "messages", tokens(content), "prompts" if kind == "user" else "replies")
        if kind == "user" and not rec.get("isMeta") and not content.startswith("<"):
            push_activity(state, {"at": at, "k": "prompt", "d": clip(content)})
        return

    for block in content or []:
        if not isinstance(block, dict):
            continue
        btype = block.get("type")
        if btype == "text":
            text = block.get("text", "")
            add(state, "messages", tokens(text), "prompts" if kind == "user" else "replies")
            if kind == "user" and not rec.get("isMeta") and not text.startswith("<"):
                push_activity(state, {"at": at, "k": "prompt", "d": clip(text)})
            elif kind == "assistant" and text.strip():
                push_activity(state, {"at": at, "k": "reply", "d": clip(text)})
        elif btype == "tool_use":
            name = block.get("name", "?")
            state["tool_names"][block.get("id")] = name
            add(state, tool_category(name), tokens(block.get("input")), name)
            push_activity(state, {"at": at, "k": KIND.get(name, "mcp" if name.startswith("mcp__") else "tool"),
                                  "n": name, "d": detail(name, block.get("input"))})
        elif btype == "tool_result":
            name = state["tool_names"].pop(block.get("tool_use_id"), "?")
            add(state, tool_category(name), tokens(block.get("content")), name)
            if block.get("is_error"):
                push_activity(state, {"at": at, "k": "error", "n": name, "d": clip(block.get("content"), 80)})
        # thinking blocks are dropped from later requests, so they don't count toward context


def read_transcript(state, path):
    try:
        size = os.path.getsize(path)
    except OSError:
        return
    if size < state["offset"]:
        state.update(fresh_state())  # rewritten (e.g. /clear into the same file)
    with open(path, "rb") as f:
        f.seek(state["offset"])
        data = f.read(READ_CHUNK)
    end = data.rfind(b"\n") + 1  # leave a half-written last line for next time
    for line in data[:end].splitlines():
        try:
            on_record(state, json.loads(line))
        except (ValueError, AttributeError, TypeError):
            continue
    state["offset"] += end


def context_label(state):
    u = state["usage"] or {}
    used = u.get("input", 0) + u.get("read", 0) + u.get("write", 0) + u.get("output", 0)
    shape = state["shape"]
    est = dict(state["cats"])
    est["system"] += shape["system"]
    est["tools"] += shape["tools"]
    est["mcp"] += shape["mcp"]
    parts = dict(state["parts"])
    for key, value in shape["parts"].items():
        parts[key] = parts.get(key, 0.0) + value
    total = sum(est.values()) or 1
    scale = used / total if used else 1  # estimates only split the exact total, never replace it
    cats = {c: round(est[c] * scale) for c in CATEGORIES}
    top = {}
    for key, value in sorted(parts.items(), key=lambda kv: -kv[1]):
        cat, name = key.split("/", 1)
        bucket = top.setdefault(cat, [])
        if len(bucket) < 4:
            bucket.append([clip(name, 40), round(value * scale)])
    return {"used": used, "cats": cats, "top": top, "model": state["model"], "compacts": state["compacts"]}


def cache_label(state):
    c = state["cache"]
    last = c["last"] or {}
    return {"read": c["read"], "write": c["write"], "uncached": c["uncached"], "misses": c["misses"],
            "ttl": last.get("ttl"), "last_at": last.get("at")}


def hc_binary():
    return shutil.which("hc") or next((p for p in ("/opt/homebrew/bin/hc", os.path.expanduser("~/.local/bin/hc"))
                                       if os.path.exists(p)), None)


def publish(terminal, labels):
    binary = hc_binary()
    if not binary:
        return False
    args = [f"{k}={json.dumps(v, ensure_ascii=False, separators=(',', ':'))}" for k, v in labels.items()]
    try:
        done = subprocess.run([binary, "label", terminal, *args], stdout=subprocess.DEVNULL,
                              stderr=subprocess.DEVNULL, timeout=5, check=False)
    except (OSError, subprocess.TimeoutExpired):
        return False
    return done.returncode == 0


def run_hook(terminal, payload):
    session = payload.get("session_id")
    transcript = payload.get("transcript_path")
    if not session or not transcript:
        return
    os.makedirs(STATE_DIR, exist_ok=True)
    path = os.path.join(STATE_DIR, f"{os.path.basename(session)}.json")
    # Async hooks overlap (PostToolUse per tool); the lock keeps offset and accumulators consistent.
    with open(path, "a+") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        f.seek(0)
        try:
            state = json.loads(f.read() or "{}")
        except ValueError:
            state = {}
        if state.get("version") != STATE_VERSION:
            state = fresh_state()
        if payload.get("hook_event_name") == "SessionStart" and payload.get("source") in ("clear", "startup"):
            state = fresh_state()
        read_transcript(state, transcript)
        f.seek(0)
        f.truncate()
        json.dump(state, f)
        # Published under the lock so overlapping hooks can't land an older state last.
        publish(terminal, {"halo.context": context_label(state), "halo.activity": state["activity"],
                           "halo.cache": cache_label(state)})


def status_label(data):
    cw = data.get("context_window") or {}
    cu = cw.get("current_usage") or {}
    pc = data.get("prompt_cache") or {}
    used = sum(cu.get(k, 0) or 0 for k in ("input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens", "output_tokens"))
    return {
        "name": clip(data.get("session_name"), 60),
        "model": (data.get("model") or {}).get("display_name"),
        "ctx": cw.get("used_percentage"),
        "used": used,
        "win": cw.get("context_window_size"),
        "exp": pc.get("expires_at"),
        "ttl": pc.get("ttl"),
        "warm": pc.get("warm"),
        "hit": pc.get("hit_ratio"),
        "miss": pc.get("last_miss_cause"),
        "cold": pc.get("recache_tokens_if_cold"),
        "rl": data.get("rate_limits"),
        "cost": (data.get("cost") or {}).get("total_cost_usd"),
        "at": int(time.time()),
    }


def run_statusline(terminal, file):
    try:
        with open(file) as f:
            data = json.load(f)
    except (OSError, ValueError):
        return
    finally:
        try:
            os.unlink(file)
        except OSError:
            pass
    label = status_label(data)
    # The statusline redraws often; skip hc when nothing but the timestamp changed.
    os.makedirs(STATE_DIR, exist_ok=True)
    marker = os.path.join(STATE_DIR, f"status-{os.path.basename(terminal)}.json")
    key = json.dumps({**label, "at": None}, sort_keys=True)
    try:
        with open(marker) as f:
            if f.read() == key:
                return
    except OSError:
        pass
    # Skip the marker on failure so the next redraw retries; terminal ids are reused after a
    # core restart, so a stale marker would otherwise hide a fresh terminal's first report.
    if publish(terminal, {"halo.status": label}):
        with open(marker, "w") as f:
            f.write(key)


def main(argv):
    terminal = os.environ.get("HC_TERMINAL_ID")
    if not terminal or len(argv) < 2:
        return 0
    try:
        if argv[1] == "hook":
            run_hook(terminal, json.load(sys.stdin))
        elif argv[1] == "statusline" and len(argv) > 2:
            run_statusline(terminal, argv[2])
    except Exception as exc:  # a reporter bug must never break the agent's hook chain
        print(f"halo-reporter: {exc}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
