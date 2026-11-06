"""Runs every browser test against a fresh production build:  python tests/browser/run_all.py
One-time setup:  pip install playwright   then   playwright install chromium"""
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).parent
SUITES = ["lazy_loading.py", "scroll_reveal.py", "admin_auth.py", "csp.py", "convex_mode.py"]


def main() -> int:
    print("Building the site...")
    subprocess.run(["npm", "run", "build"], cwd=ROOT, check=True, capture_output=True, shell=os.name == "nt")
    preview = subprocess.Popen(["npx", "vite", "preview", "--port", "4173", "--host", "127.0.0.1"], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, shell=os.name == "nt")
    try:
        for _ in range(40):
            try:
                urllib.request.urlopen("http://127.0.0.1:4173/", timeout=1)
                break
            except Exception:
                time.sleep(0.5)
        failed = 0
        for name in SUITES:
            print(f"\n=== {name} ===")
            result = subprocess.run([sys.executable, str(HERE / name)], cwd=ROOT, env=dict(os.environ, BASE_URL="http://127.0.0.1:4173"))
            out_failed = result.returncode != 0
            failed += int(out_failed)
        print("\nAll browser suites completed." if failed == 0 else f"\n{failed} suite(s) crashed; check the output above for FAIL lines.")
        return 1 if failed else 0
    finally:
        preview.terminate()


sys.exit(main())
