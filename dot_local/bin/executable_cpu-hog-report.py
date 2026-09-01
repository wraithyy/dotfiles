#!/usr/bin/env python3
"""Render cpu-hog-log TSVs into a single self-contained HTML report (inline SVG).

Usage: cpu-hog-report.py [YYYY-MM-DD|glob ...]   (default: all logs)
Output: /tmp/cpu-hog-report.html, opened in the browser.
"""
import glob
import os
import subprocess
import sys
from collections import defaultdict
from html import escape

LOGDIR = os.environ.get("CPU_HOG_LOGDIR", os.path.expanduser("~/.local/state/cpu-hogs"))
OUT = "/tmp/cpu-hog-report.html"
W, ROW = 900, 22


def load(paths):
    rows = []
    for p in paths:
        with open(p) as f:
            for line in f:
                parts = line.rstrip("\n").split("\t")
                if len(parts) == 5:
                    ts, busy, pid, cpu, cmd = parts
                    rows.append((ts, float(busy), pid, float(cpu), cmd))
    return rows


def aggregate(rows):
    """-> (timeline: [(ts, busy)] sorted, totals: [(name, summed cpu%, samples)] desc)"""
    busy = {}
    tot = defaultdict(float)
    seen = defaultdict(int)
    for ts, b, _pid, cpu, cmd in rows:
        busy[ts] = b
        name = os.path.basename(cmd.split(" ")[0]) or cmd
        tot[name] += cpu
        seen[name] += 1
    timeline = sorted(busy.items())
    totals = sorted(((n, v, seen[n]) for n, v in tot.items()), key=lambda r: -r[1])
    return timeline, totals


def bars(totals, n=20):
    top = totals[:n]
    if not top:
        return "<p>no data</p>"
    mx = top[0][1]
    out = [f'<svg viewBox="0 0 {W} {len(top)*ROW+8}" width="100%">']
    for i, (name, v, cnt) in enumerate(top):
        y = i * ROW + 4
        w = max(2, int(v / mx * (W - 340)))
        out.append(
            f'<rect x="240" y="{y}" width="{w}" height="{ROW-6}" fill="#4c8bf5"/>'
            f'<text x="232" y="{y+ROW-11}" text-anchor="end" font-size="12" fill="currentColor">{escape(name[:34])}</text>'
            f'<text x="{248+w}" y="{y+ROW-11}" font-size="11" fill="currentColor" opacity=".7">'
            f'{v:,.0f}%·s  ({cnt}x)</text>'
        )
    out.append("</svg>")
    return "".join(out)


def spark(timeline, h=140):
    if not timeline:
        return "<p>no data</p>"
    step = max(1, len(timeline) // (W // 3))
    pts = timeline[::step]
    bw = W / len(pts)
    out = [f'<svg viewBox="0 0 {W} {h}" width="100%">']
    for i, (ts, b) in enumerate(pts):
        bh = max(1, b / 100 * (h - 20))
        out.append(
            f'<rect x="{i*bw:.1f}" y="{h-bh:.1f}" width="{max(1,bw-0.5):.1f}" height="{bh:.1f}" '
            f'fill="#e0663d"><title>{escape(ts)} — {b:.0f}%</title></rect>'
        )
    out.append(
        f'<text x="0" y="12" font-size="11" fill="currentColor" opacity=".7">{escape(pts[0][0])}</text>'
        f'<text x="{W}" y="12" text-anchor="end" font-size="11" fill="currentColor" opacity=".7">{escape(pts[-1][0])}</text>'
        "</svg>"
    )
    return "".join(out)


def render(rows):
    timeline, totals = aggregate(rows)
    return f"""<!doctype html><meta charset=utf-8><title>CPU hog report</title>
<style>body{{font:14px system-ui;margin:2rem auto;max-width:960px;color-scheme:light dark}}
h2{{margin-top:2rem;font-size:15px;font-weight:600}}</style>
<h1>CPU hogs</h1>
<p>{len(timeline)} over-threshold samples, {len(totals)} distinct processes.</p>
<h2>When (total CPU busy % per sample, hover for time)</h2>{spark(timeline)}
<h2>Who (summed CPU% across samples = share of blame)</h2>{bars(totals)}"""


def selftest():
    rows = [
        ("t1", 90.0, "1", 80.0, "/Applications/Foo.app/Contents/MacOS/Foo"),
        ("t1", 90.0, "2", 10.0, "/usr/bin/bar"),
        ("t2", 95.0, "1", 50.0, "/Applications/Foo.app/Contents/MacOS/Foo"),
    ]
    timeline, totals = aggregate(rows)
    assert timeline == [("t1", 90.0), ("t2", 95.0)], timeline
    assert totals[0] == ("Foo", 130.0, 2), totals
    assert "Foo" in render(rows)
    print("ok")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "--selftest":
        selftest()
        sys.exit()
    paths = []
    for a in args or ["*"]:
        pattern = a if os.sep in a else os.path.join(LOGDIR, f"{a}*.tsv")
        paths += glob.glob(pattern)
    paths = sorted(set(p for p in paths if p.endswith(".tsv")))
    if not paths:
        sys.exit(f"no logs in {LOGDIR}")
    with open(OUT, "w") as f:
        f.write(render(load(paths)))
    print(OUT)
    subprocess.run(["open", OUT], check=False)
