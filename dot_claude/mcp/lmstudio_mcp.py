#!/usr/bin/env -S uv run --script
# /// script
# dependencies = ["mcp[cli]", "openai"]
# ///
"""LM Studio MCP server — local Qwen2.5-Coder-7B exploration pipeline."""

import os
from pathlib import Path
from mcp.server.fastmcp import FastMCP
from openai import OpenAI

LM_STUDIO_URL = os.getenv("LM_STUDIO_URL", "http://localhost:1234/v1")
MAX_FILE_CHARS = 6000
MAX_BATCH_FILES = 8

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "dist", "build", ".next", ".turbo", "coverage"}
SKIP_EXTS = {".lock", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".map"}

mcp = FastMCP("lmstudio")
client = OpenAI(base_url=LM_STUDIO_URL, api_key="lm-studio")

DIGEST_FORMAT = """Purpose: <1 sentence>
Key exports: <comma-separated or "none">
Dependencies: <notable imports, max 5>
LOC: {loc}
Patterns: <max 3 bullets, each under 10 words>"""


def _llm(prompt: str, max_tokens: int = 500, temperature: float = 0.0) -> str:
    resp = client.chat.completions.create(
        model="local-model",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return resp.choices[0].message.content


def _read_file(p: Path) -> tuple[str, int]:
    content = p.read_text(encoding="utf-8", errors="replace")
    return content, content.count("\n") + 1


def _is_source(p: Path, min_loc: int = 30) -> bool:
    if any(part in SKIP_DIRS for part in p.parts):
        return False
    if p.suffix in SKIP_EXTS or not p.is_file():
        return False
    try:
        loc = p.read_text(encoding="utf-8", errors="replace").count("\n") + 1
        return loc >= min_loc
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@mcp.tool()
def ask(prompt: str, max_tokens: int = 600) -> str:
    """General prompt to local Qwen. Use for simple analysis, pattern detection, quick questions.
    NOT for: security review, architecture decisions, anything requiring high reliability."""
    return _llm(prompt, max_tokens=max_tokens, temperature=0.1)


@mcp.tool()
def digest_path(path: str) -> str:
    """Read one file from disk and return a compact structured digest.
    File content never enters the orchestrator's context — pass path only.
    Returns: Purpose / Key exports / Dependencies / LOC / Patterns."""
    p = Path(path).expanduser().resolve()
    if not p.exists() or not p.is_file():
        return f"Error: {path} not found or not a file"
    try:
        content, loc = _read_file(p)
    except Exception as e:
        return f"Error reading {path}: {e}"

    prompt = f"""Analyze this source file. Return ONLY the structured summary below, no extra text.

File: {p.name} ({loc} lines)
```
{content[:MAX_FILE_CHARS]}
```

{DIGEST_FORMAT.format(loc=loc)}"""
    return _llm(prompt, max_tokens=350)


@mcp.tool()
def batch_digest(paths: list[str]) -> str:
    """Digest multiple files in one LM Studio call — more efficient than N digest_path calls.
    Cap: {MAX_BATCH_FILES} files. File contents never enter the orchestrator's context.
    Returns a digest block per file."""
    resolved = []
    for raw in paths[:MAX_BATCH_FILES]:
        p = Path(raw).expanduser().resolve()
        if p.exists() and p.is_file():
            try:
                content, loc = _read_file(p)
                resolved.append((p, content, loc))
            except Exception:
                pass

    if not resolved:
        return "No readable files found"

    blocks = []
    for p, content, loc in resolved:
        blocks.append(f"### {p.name} ({loc} lines)\n```\n{content[:MAX_FILE_CHARS // len(resolved)]}\n```")

    prompt = f"""Analyze each source file below. For EACH file return a digest in this exact format:

FILE: <filename>
Purpose: <1 sentence>
Key exports: <comma-separated or "none">
Dependencies: <notable imports, max 4>
LOC: <number>
Patterns: <max 2 bullets>

---
{chr(10).join(blocks)}"""
    return _llm(prompt, max_tokens=150 * len(resolved))


@mcp.tool()
def explore_dir(path: str, min_loc: int = 30) -> str:
    """Scan a directory and return a codebase overview.
    Reads file names + sizes only — no file content enters the orchestrator's context.
    Returns: entry points, architecture, stack, key patterns."""
    p = Path(path).expanduser().resolve()
    if not p.exists() or not p.is_dir():
        return f"Error: {path} is not a directory"

    files = []
    for f in sorted(p.rglob("*")):
        if not _is_source(f, min_loc=min_loc):
            continue
        try:
            loc = f.read_text(encoding="utf-8", errors="replace").count("\n") + 1
            files.append((str(f.relative_to(p)), loc))
        except Exception:
            pass

    if not files:
        return "No source files found"

    file_list = "\n".join(f"  {name} ({loc}L)" for name, loc in files[:80])
    prompt = f"""You are analyzing a software project. Based on the file listing below, give a concise overview.

Directory: {p.name}/
Source files (≥{min_loc} LOC):
{file_list}

Return exactly:
Entry points: <main files, max 3>
Architecture: <1-2 sentences>
Stack: <languages/frameworks detected>
Notable patterns: <max 3 bullets>
Suggested read order: <3-5 files to read first to understand the codebase>"""
    return _llm(prompt, max_tokens=450)


@mcp.tool()
def summarize_diff(diff: str) -> str:
    """Summarize a git diff into plain English for pre-screening before code-reviewer.
    Use: pipe `git diff` or `git show` output here first — cheap local check.
    Returns risk level + plain summary so you can decide if full Sonnet review is needed."""
    if not diff.strip():
        return "Empty diff"

    prompt = f"""Summarize this git diff concisely.

```diff
{diff[:8000]}
```

Return exactly:
Summary: <1-2 sentences what changed>
Risk: LOW / MEDIUM / HIGH
Reason: <why that risk level, 1 sentence>
Review needed: YES / NO / OPTIONAL"""
    return _llm(prompt, max_tokens=200)


@mcp.tool()
def find_symbol(symbol: str, path: str) -> str:
    """Search for a symbol (function, class, type) across a directory and explain its usages.
    Reads matching file snippets locally — content never enters orchestrator's context."""
    p = Path(path).expanduser().resolve()
    if not p.exists():
        return f"Error: {path} not found"

    hits = []
    search_in = [p] if p.is_file() else list(p.rglob("*"))
    for f in search_in:
        if not _is_source(f, min_loc=1):
            continue
        try:
            content = f.read_text(encoding="utf-8", errors="replace")
            if symbol not in content:
                continue
            lines = content.splitlines()
            matching = [(i + 1, l) for i, l in enumerate(lines) if symbol in l][:6]
            if matching:
                snippet = "\n".join(f"  L{n}: {l.strip()}" for n, l in matching)
                hits.append(f"### {f.relative_to(p) if p.is_dir() else f.name}\n{snippet}")
        except Exception:
            pass

    if not hits:
        return f"Symbol '{symbol}' not found in {path}"

    prompt = f"""Explain how '{symbol}' is used across this codebase based on the snippets below.

{chr(10).join(hits[:10])}

Return:
Definition: <where it's defined, 1 line>
Usage pattern: <how it's used, 1-2 sentences>
Callers: <files that use it, comma-separated>"""
    return _llm(prompt, max_tokens=300)


if __name__ == "__main__":
    mcp.run()
