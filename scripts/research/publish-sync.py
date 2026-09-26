#!/usr/bin/env python3
"""Commit working-tree changes under the given paths to origin/main via the
GitHub git-data API, then sync the local main ref.

Used by the scheduled Zenodo research sync. Fast-forward only: if origin/main
moved since we read it, the ref update fails and nothing is pushed.

Usage:
    publish-sync.py --message "commit message" -- paths...
"""
from __future__ import annotations
import argparse, base64, json, subprocess, sys, urllib.request

sys.path.insert(0, "/opt/hatch/skills/skill-creator/bin")
from dynamic_credentials import add_surrogate_to_request, read_json_response

API = "https://api.github.com"
REPO = "IAMGODIAM/e5-website"
ALLOWED = ["api.github.com"]
AUTHOR = ("Israel Lee Armstead", "83841652+IAMGODIAM@users.noreply.github.com")


def call(method, path, data=None):
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(API + path, data=body, method=method)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    if body:
        req.add_header("Content-Type", "application/json")
    add_surrogate_to_request(req, "custom.github", allowed_hosts=ALLOWED)
    return read_json_response(urllib.request.urlopen(req, timeout=60))


def sh(*args, cwd):
    return subprocess.run(args, cwd=cwd, capture_output=True, text=True, check=True).stdout


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--message", required=True)
    ap.add_argument("--repo", default="/home/hatch/workspace/e5-website-edit")
    ap.add_argument("paths", nargs="+")
    a = ap.parse_args()

    status = sh("git", "status", "--porcelain", "--", *a.paths, cwd=a.repo)
    files = [ln[3:] for ln in status.splitlines() if ln.strip() and not ln.startswith("??")]
    untracked = [ln[3:] for ln in status.splitlines() if ln.startswith("??")]
    files += untracked
    # Handle renames ("R  old -> new")
    files = [f.split(" -> ")[-1] for f in files]
    if not files:
        print("no changes under the given paths")
        return 0

    ref = call("GET", f"/repos/{REPO}/git/ref/heads/main")
    main_sha = ref["object"]["sha"]
    base_tree = call("GET", f"/repos/{REPO}/git/commits/{main_sha}")["tree"]["sha"]

    entries = []
    for f in sorted(set(files)):
        p = f"{a.repo}/{f}"
        try:
            with open(p, "rb") as fh:
                content = base64.b64encode(fh.read()).decode()
        except FileNotFoundError:
            entries.append({"path": f, "mode": "100644", "type": "blob", "sha": None})
            continue
        blob = call("POST", f"/repos/{REPO}/git/blobs",
                    {"content": content, "encoding": "base64"})
        entries.append({"path": f, "mode": "100644", "type": "blob", "sha": blob["sha"]})
    print(f"{len(entries)} blobs", flush=True)

    tree = call("POST", f"/repos/{REPO}/git/trees",
                {"base_tree": base_tree, "tree": entries})
    commit = call("POST", f"/repos/{REPO}/git/commits", {
        "message": a.message,
        "tree": tree["sha"],
        "parents": [main_sha],
        "author": {"name": AUTHOR[0], "email": AUTHOR[1]},
    })
    print("commit", commit["sha"][:8], flush=True)

    try:
        call("PATCH", f"/repos/{REPO}/git/refs/heads/main",
             {"sha": commit["sha"], "force": False})
    except Exception as exc:
        print(f"ref update failed (main moved; not forcing): {exc}")
        return 2
    print("pushed to origin/main", flush=True)

    # Sync the local main ref so the working tree state stays truthful.
    subprocess.run(["git", "fetch", "origin",
                    "refs/heads/main:refs/remotes/origin/main"],
                   cwd=a.repo, capture_output=True, timeout=60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
