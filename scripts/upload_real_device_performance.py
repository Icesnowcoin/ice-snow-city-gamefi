#!/usr/bin/env python3
"""Safely upload reviewed iOS/Android performance JSON and dispatch CI.

The default mode is dry-run. A real upload requires an explicit
ISC_GITHUB_TOKEN (or the environment variable selected by --token-env) with
repository contents write and actions write permissions.

Example:
  python3 scripts/upload_real_device_performance.py \
    --input ./device-results \
    --repo Icesnowcoin/ice-snow-city-gamefi \
    --base-branch main \
    --upload
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path
from typing import Any

from analyze_real_device_performance import Thresholds, assess_runs, load_inputs, validate_report


SENSITIVE_KEY_PARTS = {
    "access_token",
    "authorization",
    "cookie",
    "deviceid",
    "email",
    "ghp_",
    "github_pat_",
    "password",
    "privatekey",
    "secret",
    "serialnumber",
    "session",
    "token",
    "udid",
}
SENSITIVE_VALUE_PATTERNS = (
    re.compile(r"ghp_[A-Za-z0-9_\-]{20,}"),
    re.compile(r"github_pat_[A-Za-z0-9_\-]{20,}"),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    re.compile(r"(?i)bearer\s+[A-Za-z0-9._\-]{16,}"),
)


class UploadError(RuntimeError):
    pass


def normalize_key(key: str) -> str:
    return re.sub(r"[^a-z0-9_]", "", key.lower())


def find_sensitive_fields(value: Any, path: str = "$", findings: list[str] | None = None) -> list[str]:
    findings = findings if findings is not None else []
    if isinstance(value, dict):
        for key, child in value.items():
            key_text = str(key)
            normalized = normalize_key(key_text)
            if any(part in normalized for part in SENSITIVE_KEY_PARTS):
                findings.append(f"{path}.{key_text}")
            find_sensitive_fields(child, f"{path}.{key_text}", findings)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            find_sensitive_fields(child, f"{path}[{index}]", findings)
    elif isinstance(value, str):
        for pattern in SENSITIVE_VALUE_PATTERNS:
            if pattern.search(value):
                findings.append(f"{path}:sensitive-value")
                break
    return findings


def collect_files(inputs: list[Path]) -> list[tuple[Path, dict[str, Any], bytes]]:
    loaded = load_inputs(inputs)
    if not loaded:
        raise UploadError("no JSON input files found")
    collected: list[tuple[Path, dict[str, Any], bytes]] = []
    for path, report in loaded:
        raw = json.dumps(report, ensure_ascii=False, indent=2).encode("utf-8") + b"\n"
        collected.append((path, report, raw))
    return collected


def validate_uploads(collected: list[tuple[Path, dict[str, Any], bytes]], allow_software: bool) -> dict[str, Any]:
    all_issues: list[dict[str, str]] = []
    sources: list[str] = []
    report_count = 0
    for path, report, _ in collected:
        source = report.get("source")
        if source not in {"ios-real", "android-real"} and not (allow_software and source in {"ci-software", "ci-gpu"}):
            all_issues.append({"file": str(path), "message": "only ios-real/android-real reports may be uploaded by default"})
        if isinstance(source, str):
            sources.append(source)
        issues, summaries = validate_report(path, report)
        assessed_issues = list(issues)
        assess_runs(summaries, assessed_issues, Thresholds())
        for issue in assessed_issues:
            all_issues.append({"file": issue.file, "message": issue.message})
        for summary in summaries:
            if summary.status == "blocked":
                all_issues.append({"file": summary.file, "message": f"performance threshold blocked: {summary.issues}"})
        findings = find_sensitive_fields(report)
        for finding in findings:
            all_issues.append({"file": str(path), "message": f"sensitive field/value detected at {finding}"})
        report_count += len(summaries)
    if all_issues:
        raise UploadError(json.dumps({"status": "blocked", "issues": all_issues}, ensure_ascii=False))
    return {"status": "validated", "files": len(collected), "samples": report_count, "sources": sorted(set(sources))}


def post_slack(webhook: str, text: str) -> None:
    payload = json.dumps({"text": text}).encode("utf-8")
    request = urllib.request.Request(webhook, data=payload, method="POST")
    request.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(request, timeout=10) as response:
        if response.status >= 300:
            raise UploadError(f"Slack notification returned HTTP {response.status}")


def safe_error_text(error: BaseException) -> str:
    text = str(error)
    text = re.sub(r"(?i)bearer\s+[A-Za-z0-9._-]{8,}", "Bearer [redacted]", text)
    text = re.sub(r"ghp_[A-Za-z0-9_-]{8,}", "[redacted-token]", text)
    text = re.sub(r"github_pat_[A-Za-z0-9_-]{8,}", "[redacted-token]", text)
    return text[:500]


def notify_slack(args: argparse.Namespace, status: str, details: str) -> None:
    if not args.notify_slack:
        return
    webhook = os.environ.get(args.slack_webhook_env)
    if not webhook:
        raise UploadError(f"--notify-slack requires explicit {args.slack_webhook_env}")
    text = f"Ice Snow City performance upload: {status}\\nrepo={args.repo} workflow={args.workflow}\\n{details[:700]}"
    try:
        post_slack(webhook, text)
    except Exception as exc:  # Notification must not hide the primary failure.
        print(f"warning: Slack notification failed: {safe_error_text(exc)}", file=sys.stderr)


def api_request(token: str, method: str, url: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=body, method=method)
    request.add_header("Authorization", f"Bearer {token}")
    request.add_header("Accept", "application/vnd.github+json")
    request.add_header("X-GitHub-Api-Version", "2022-11-28")
    if body is not None:
        request.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise UploadError(f"GitHub API {exc.code} {method} {url}: {detail[:500]}") from exc
    except urllib.error.URLError as exc:
        raise UploadError(f"GitHub API connection failed: {exc.reason}") from exc


def safe_remote_name(path: Path, used: set[str]) -> str:
    name = re.sub(r"[^A-Za-z0-9._-]", "-", path.name)
    if not name.endswith(".json"):
        name += ".json"
    candidate = name
    if candidate in used:
        digest = hashlib.sha256(str(path).encode("utf-8")).hexdigest()[:8]
        candidate = f"{path.stem}-{digest}.json"
    used.add(candidate)
    return candidate


def upload_and_dispatch(args: argparse.Namespace, collected: list[tuple[Path, dict[str, Any], bytes]], token: str) -> dict[str, Any]:
    api = f"https://api.github.com/repos/{args.repo}"
    base = api_request(token, "GET", f"{api}/git/ref/heads/{args.base_branch}")
    base_sha = base.get("object", {}).get("sha")
    if not base_sha:
        raise UploadError("could not resolve base branch SHA")
    branch = f"{args.branch_prefix}/{args.base_branch}-{uuid.uuid4().hex[:10]}"
    api_request(token, "POST", f"{api}/git/refs", {"ref": f"refs/heads/{branch}", "sha": base_sha})
    used: set[str] = set()
    remote_files: list[str] = []
    for path, _, raw in collected:
        remote_name = safe_remote_name(path, used)
        remote_path = f"{args.remote_dir.strip('/')}/{remote_name}"
        payload = {
            "message": f"perf: upload reviewed {remote_name}",
            "content": base64.b64encode(raw).decode("ascii"),
            "branch": branch,
        }
        api_request(token, "PUT", f"{api}/contents/{remote_path}", payload)
        remote_files.append(remote_path)
    dispatch_url = f"{api}/actions/workflows/{args.workflow}/dispatches"
    api_request(token, "POST", dispatch_url, {"ref": branch})
    return {"status": "uploaded", "branch": branch, "baseSha": base_sha, "files": remote_files, "workflow": args.workflow}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", action="append", required=True, type=Path, help="JSON file or directory; repeatable")
    parser.add_argument("--repo", required=True, help="owner/name")
    parser.add_argument("--base-branch", default="main")
    parser.add_argument("--remote-dir", default="performance-data")
    parser.add_argument("--workflow", default="real-device-performance.yml")
    parser.add_argument("--branch-prefix", default="perf-data")
    parser.add_argument("--allow-software", action="store_true", help="allow ci-software/ci-gpu reports; never use for real-device gate")
    parser.add_argument("--dry-run", action="store_true", help="validate and print the upload plan without calling GitHub")
    parser.add_argument("--upload", action="store_true", help="perform the GitHub upload and workflow dispatch")
    parser.add_argument("--token-env", default="ISC_GITHUB_TOKEN", help="explicit environment variable containing the GitHub token")
    parser.add_argument("--notify-slack", action="store_true", help="send trigger success/failure notifications to Slack")
    parser.add_argument("--slack-webhook-env", default="SLACK_WEBHOOK_URL", help="explicit environment variable containing Slack webhook URL")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.upload and args.dry_run:
        print("--upload and --dry-run are mutually exclusive", file=sys.stderr)
        return 2
    if not args.upload and not args.dry_run:
        print("refusing to upload implicitly; choose --dry-run or --upload", file=sys.stderr)
        return 2
    if args.notify_slack and not os.environ.get(args.slack_webhook_env):
        print(f"--notify-slack requires explicit {args.slack_webhook_env}", file=sys.stderr)
        return 2
    try:
        collected = collect_files(args.input)
        validation = validate_uploads(collected, args.allow_software)
        plan = {
            "status": "dry-run-valid" if args.dry_run else "validated",
            "repo": args.repo,
            "baseBranch": args.base_branch,
            "remoteDir": args.remote_dir,
            "workflow": args.workflow,
            "validation": validation,
            "localFiles": [str(path) for path, _, _ in collected],
        }
        if args.dry_run:
            notify_slack(args, "DRY-RUN VALIDATED", f"files={validation['files']} samples={validation['samples']}")
            print(json.dumps(plan, ensure_ascii=False, indent=2))
            return 0
        token = os.environ.get(args.token_env)
        if not token:
            raise UploadError(f"--upload requires explicit {args.token_env}; use --dry-run without a token")
        result = upload_and_dispatch(args, collected, token)
        notify_slack(args, "TRIGGER ACCEPTED", f"branch={result['branch']} files={len(result['files'])}")
        print(json.dumps({**plan, **result}, ensure_ascii=False, indent=2))
        return 0
    except UploadError as exc:
        try:
            notify_slack(args, "FAILED", safe_error_text(exc))
        except UploadError as notify_error:
            print(str(notify_error), file=sys.stderr)
        print(str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
