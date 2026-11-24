#!/usr/bin/env python3
"""Self-check for report.py: python3 -I test_report.py"""

import json
import os
import sys
import tempfile

sys.dont_write_bytecode = True  # keep __pycache__ out of the chezmoi source
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import report  # noqa: E402


def usage(read, write, ts, model="m1", mid=None, ttl1h=True):
    return {"type": "assistant", "timestamp": ts, "message": {
        "id": mid or ts, "model": model, "content": [{"type": "text", "text": "ok"}],
        "usage": {"input_tokens": 5, "cache_read_input_tokens": read, "cache_creation_input_tokens": write,
                  "output_tokens": 10, "cache_creation": {"ephemeral_1h_input_tokens": write if ttl1h else 0}}}}


RECORDS = [
    {"type": "api-request-shape", "shape": {"system": [{"type": "text", "text": "s" * 700}],
                                            "tools": [{"name": "Bash", "description": "b" * 350},
                                                      {"name": "mcp__gitlab__get", "description": "g" * 350}]}},
    {"type": "attachment", "attachment": {"type": "instructions", "content": "m" * 350}},
    {"type": "user", "timestamp": "2026-01-01T10:00:00Z", "message": {"role": "user", "content": "fix the login bug"}},
    {"type": "assistant", "timestamp": "2026-01-01T10:00:01Z", "message": {"id": "a1", "content": [
        {"type": "tool_use", "id": "tu1", "name": "Read", "input": {"file_path": "/repo/src/login.ts"}}]}},
    {"type": "user", "timestamp": "2026-01-01T10:00:02Z", "message": {"role": "user", "content": [
        {"type": "tool_result", "tool_use_id": "tu1", "content": "x" * 3500}]}},
    usage(10000, 2000, "2026-01-01T10:00:03Z"),
    # Two hours idle with a 1h TTL: the prefix is rewritten, which must be logged as an idle miss.
    usage(0, 12000, "2026-01-01T12:00:00Z"),
]


def main():
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "t.jsonl")
        with open(path, "w") as f:
            for rec in RECORDS[:4]:
                f.write(json.dumps(rec) + "\n")
            f.write(json.dumps(RECORDS[4])[:20])  # half-written line must wait for the next run

        state = report.fresh_state()
        report.read_transcript(state, path)
        assert state["activity"][-1]["k"] == "read", state["activity"]
        assert state["activity"][-1]["d"] == "login.ts"
        assert state["cats"]["tools"] > 0 and state["cats"]["memory"] > 0

        with open(path, "w") as f:
            for rec in RECORDS:
                f.write(json.dumps(rec) + "\n")
        report.read_transcript(state, path)

        ctx = report.context_label(state)
        assert ctx["used"] == 5 + 0 + 12000 + 10, ctx["used"]
        assert abs(sum(ctx["cats"].values()) - ctx["used"]) <= len(report.CATEGORIES), ctx
        assert ctx["cats"]["tools"] > ctx["cats"]["memory"] > 0, ctx["cats"]
        assert ctx["cats"]["mcp"] > 0 and ctx["cats"]["system"] > 0
        assert [p[0] for p in ctx["top"]["tools"]][0] == "Read", ctx["top"]

        misses = state["cache"]["misses"]
        assert len(misses) == 1 and misses[0]["cause"] == "idle 120m", misses
        assert report.cache_label(state)["ttl"] == 3600

        compact = {"type": "system", "subtype": "compact_boundary", "compactMetadata": {"preTokens": 9, "trigger": "auto"}}
        with open(path, "a") as f:
            f.write(json.dumps(compact) + "\n")
            f.write(json.dumps(usage(0, 3000, "2026-01-01T12:01:00Z")) + "\n")
        report.read_transcript(state, path)
        assert state["cats"]["tools"] == 0, "compaction must reset the context split"
        assert state["cache"]["misses"][-1]["cause"] == "compact", state["cache"]["misses"]

    shot = [{"type": "text", "text": "ab"}, {"type": "image", "source": {"type": "base64", "data": "x" * 100000}}]
    assert report.tokens(shot) == report.IMAGE_TOKENS + 2 / report.CHARS_PER_TOKEN

    status = report.status_label({"context_window": {"used_percentage": 12, "context_window_size": 1000000,
                                                     "current_usage": {"input_tokens": 2, "cache_read_input_tokens": 100}},
                                  "prompt_cache": {"expires_at": 123, "ttl": "1h"}, "rate_limits": {"five_hour": {}}})
    assert status["used"] == 102 and status["exp"] == 123 and status["ctx"] == 12
    print("ok")


if __name__ == "__main__":
    main()
