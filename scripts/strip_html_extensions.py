#!/usr/bin/env python3
"""Rewrite internal href/src to extensionless paths. Run from repo root."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

ATTR_RE = re.compile(
    r"\b(href|src)=(['\"])([^'\"]*\.html[^'\"]*)\2",
    re.IGNORECASE,
)


def strip_html_url(raw: str) -> str:
    if not raw or raw.startswith(("http://", "https://", "//", "mailto:", "tel:", "#")):
        return raw
    if "://" in raw:
        return raw

    h = ""
    if "#" in raw:
        raw, h = raw.split("#", 1)
        h = "#" + h
    q = ""
    if "?" in raw:
        raw, q = raw.split("?", 1)
        q = "?" + q

    if not raw.endswith(".html"):
        return raw + q + h

    base = raw[:-5]
    if base == "index":
        out = "./"
    elif base.endswith("/index"):
        out = base[:-5]  # drop "index", keep trailing /
    else:
        out = base
    return out + q + h


def sub_attr(match: re.Match) -> str:
    attr, quote, val = match.group(1), match.group(2), match.group(3)
    if not val or val.startswith(("http://", "https://", "//", "mailto:", "tel:", "#", "data:")):
        return match.group(0)
    for prefix in ("js/", "../js/", "../../js/", "css/", "../css/", "../../css/", "img/", "../img/", "../../img/"):
        if val.startswith(prefix):
            return match.group(0)
    if ".html" not in val:
        return match.group(0)
    return f"{attr}={quote}{strip_html_url(val)}{quote}"


def process_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    new = ATTR_RE.sub(sub_attr, text)
    if new == text:
        return False
    path.write_text(new, encoding="utf-8")
    return True


def main() -> None:
    n = 0
    for p in sorted(ROOT.rglob("*.html")):
        if process_file(p):
            n += 1
            print("updated", p.relative_to(ROOT))
    print("done,", n, "html files")


if __name__ == "__main__":
    main()
