"""Shared helpers for the browser tests (Python + Playwright)."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = os.environ.get("BASE_URL", "http://127.0.0.1:4173")  # a running `npm run preview`


def launch(p):
    """Uses the Chromium that `playwright install chromium` downloaded (or CHROME_PATH if you set it)."""
    path = os.environ.get("CHROME_PATH")
    kwargs = {"args": ["--no-sandbox"]}
    if path:
        kwargs["executable_path"] = path
    return p.chromium.launch(**kwargs)
