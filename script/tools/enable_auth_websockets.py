#!/usr/bin/env python3

import json
import shutil
import sys
from datetime import datetime
from pathlib import Path


def usage():
    print("Usage: python3 enable_auth_websockets.py <auth-dir> [--dry-run] [--no-backup]")


def main():
    if len(sys.argv) < 2:
        usage()
        return 1

    auth_dir = Path(sys.argv[1]).expanduser().resolve()
    dry_run = "--dry-run" in sys.argv
    no_backup = "--no-backup" in sys.argv
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    stats = {}

    for file in auth_dir.rglob("*.json"):
        try:
            data = json.loads(file.read_text(encoding="utf-8"))
        except Exception:
            stats["skipped"] = stats.get("skipped", 0) + 1
            print(f"skipped: {file} (invalid_json)")
            continue

        if not isinstance(data, dict):
            stats["skipped"] = stats.get("skipped", 0) + 1
            print(f"skipped: {file} (json_root_not_object)")
            continue

        if data.get("websockets") is True:
            stats["unchanged"] = stats.get("unchanged", 0) + 1
            print(f"unchanged: {file}")
            continue

        data["websockets"] = True

        if dry_run:
            stats["would_update"] = stats.get("would_update", 0) + 1
            print(f"would_update: {file}")
            continue

        if not no_backup:
            shutil.copy2(file, f"{file}.bak-{stamp}")

        file.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        stats["updated"] = stats.get("updated", 0) + 1
        print(f"updated: {file}")

    print("summary:", stats)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
