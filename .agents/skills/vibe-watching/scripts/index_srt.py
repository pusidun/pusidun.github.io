#!/usr/bin/env python3
"""Convert an existing UTF-8 SRT to a timestamped evidence-search index."""
import argparse
import json
import math
from pathlib import Path
import re
import sys

STAMP = r"\d{2,}:[0-5]\d:[0-5]\d[,\.]\d{3}"
TIMING = re.compile(rf"^({STAMP})\s*-->\s*({STAMP})(?:\s+.*)?$")


def seconds(stamp):
    hours, minutes, rest = stamp.replace(",", ".").split(":")
    return int(hours) * 3600 + int(minutes) * 60 + float(rest)


def parse_srt(text, duration=None):
    normalized = text.lstrip("\ufeff").replace("\r\n", "\n").replace("\r", "\n").strip()
    if not normalized:
        raise ValueError("SRT is empty")
    cues = []
    previous_start = -1
    for number, block in enumerate(re.split(r"\n[ \t]*\n+", normalized), 1):
        lines = block.splitlines()
        if lines and lines[0].strip().isdigit():
            lines = lines[1:]
        match = TIMING.fullmatch(lines[0].strip()) if lines else None
        if not match or len(lines) < 2:
            raise ValueError(f"Block {number}: expected timestamp line and subtitle text")
        start, end = map(seconds, match.groups())
        if end <= start or start < previous_start:
            raise ValueError(f"Block {number}: reversed, zero-length or out-of-order timing")
        if duration is not None and end > duration:
            raise ValueError(f"Block {number}: end {end:.3f}s exceeds supplied duration {duration}s")
        content = "\n".join(lines[1:]).strip()
        if not content:
            raise ValueError(f"Block {number}: empty subtitle")
        cues.append({
            "cue": number,
            "start": match.group(1).replace(",", "."),
            "end": match.group(2).replace(",", "."),
            "start_seconds": round(start, 3),
            "end_seconds": round(end, 3),
            "text": content,
        })
        previous_start = start
    return cues


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("srt", type=Path)
    parser.add_argument("--bvid", help="Optional Bilibili BV identifier; requires --page")
    parser.add_argument("--page", type=int, help="One-based part within this BV")
    parser.add_argument("--duration", type=float, help="Exact source duration in seconds, if known")
    parser.add_argument("--output", type=Path, help="JSON output; defaults to stdout")
    args = parser.parse_args()
    if args.bvid and not re.fullmatch(r"BV[0-9A-Za-z]{10}", args.bvid):
        parser.error("--bvid must be a BV identifier, not a URL")
    if bool(args.bvid) != (args.page is not None) or (args.page is not None and args.page < 1):
        parser.error("--bvid and a positive --page must be supplied together")
    if args.duration is not None and (not math.isfinite(args.duration) or args.duration <= 0):
        parser.error("--duration must be finite and positive")
    if args.output and args.output.resolve() == args.srt.resolve():
        parser.error("output must not overwrite the SRT input")
    try:
        cues = parse_srt(args.srt.read_text(encoding="utf-8-sig"), args.duration)
        if args.bvid:
            for cue in cues:
                cue["url"] = (f"https://www.bilibili.com/video/{args.bvid}/"
                              f"?p={args.page}&t={math.floor(cue['start_seconds'])}")
        payload = {
            "source_file": args.srt.name,
            "bvid": args.bvid,
            "page": args.page,
            "duration_seconds": args.duration,
            "last_cue_end_seconds": cues[-1]["end_seconds"],
            "notice": "Time coordinates only; source alignment and semantic accuracy require review.",
            "cues": cues,
        }
        output = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
        if args.output:
            args.output.write_text(output, encoding="utf-8")
        else:
            sys.stdout.write(output)
    except (OSError, UnicodeError, ValueError) as error:
        parser.exit(1, f"Error: {error}\n")


if __name__ == "__main__":
    main()
