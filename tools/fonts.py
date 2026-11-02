"""Download the site's fonts from Google Fonts into fonts/ (SIL OFL), latin + latin-ext for Turkish.

  py -3 tools/fonts.py

Jost (variable, 400–600) for display, Figtree (variable, 400–600) for text, JetBrains Mono 500 for
measurements. The @font-face rules in css/site.css point at the files this writes.
"""
import os
import re
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "fonts")
FAMILIES = {
    "jost": "Jost:wght@400..600",
    "figtree": "Figtree:wght@400..600",
    "jetbrains-mono": "JetBrains+Mono:wght@500",
}
# a current browser's user agent, so Google serves woff2
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30).read()


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, family in FAMILIES.items():
        css = get(f"https://fonts.googleapis.com/css2?family={family}&display=swap").decode()
        # each block is preceded by a /* subset */ comment
        for subset, url in re.findall(r"/\* ([\w-]+) \*/\s*@font-face\s*{[^}]*?url\((https://[^)]+\.woff2)\)", css):
            if subset not in ("latin", "latin-ext"):
                continue
            path = os.path.join(OUT, f"{name}-{subset}.woff2")
            with open(path, "wb") as f:
                f.write(get(url))
            print(path, os.path.getsize(path))


if __name__ == "__main__":
    main()
