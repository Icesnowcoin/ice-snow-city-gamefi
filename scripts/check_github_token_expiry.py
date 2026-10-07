#!/usr/bin/env python3
"""Check a GitHub token's recorded expiry and read-only API access.

The token is read only from an environment variable and is never printed.
The expiry date should be recorded separately when the token is created:

    export ISC_GITHUB_TOKEN='...'
    export ISC_GITHUB_TOKEN_EXPIRES_AT='2026-12-17'
    python3 scripts/check_github_token_expiry.py \
      --repo Icesnowcoin/ice-snow-city-gamefi
    unset ISC_GITHUB_TOKEN ISC_GITHUB_TOKEN_EXPIRES_AT

Exit codes:
  0  healthy or warning (not expired; warning is controlled by --warn-days)
  2  invalid arguments or missing configuration
  10 expired token
  11 GitHub API/authentication failure
  12 repository or Actions access could not be verified
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

DEFAULT_API = "https://api.github.com"
DEFAULT_TOKEN_ENV = "ISC_GITHUB_TOKEN"
DEFAULT_EXPIRY_ENV = "ISC_GITHUB_TOKEN_EXPIRES_AT"
DEFAULT_API_VERSION = "2022-11-28"
TOKEN_PATTERNS = (
    re.compile(r"ghp_[A-Za-z0-9_\-]{8,}"),
    re.compile(r"github_pat_[A-Za-z0-9_\-]{8,}"),
    re.compile(r"(?i)bearer\s+[A-Za-z0-9._\-]{8,}"),
)


class CheckError(RuntimeError):
    """A safe, user-facing check failure."""


@dataclass(frozen=True)
class ApiResponse:
    status: int
    body: dict[str, Any]
    headers: dict[str, str]


def safe_text(value: object) -> str:
    """Remove token-like values from errors before displaying them."""
    text = str(value)
    for pattern in TOKEN_PATTERNS:
        text = pattern.sub("[redacted]", text)
    return text[:400]


def parse_expiry(value: str) -> dt.date:
    """Accept YYYY-MM-DD or an ISO-8601 timestamp and return its UTC date."""
    raw = value.strip()
    if not raw:
        raise CheckError("token expiry is empty")
    try:
        return dt.date.fromisoformat(raw)
    except ValueError:
        pass
    try:
        timestamp = raw.replace("Z", "+00:00")
        parsed = dt.datetime.fromisoformat(timestamp)
        if parsed.tzinfo is not None:
            parsed = parsed.astimezone(dt.timezone.utc)
        return parsed.date()
    except ValueError as exc:
        raise CheckError("expiry must be YYYY-MM-DD or an ISO-8601 timestamp") from exc


def api_request(token: str, method: str, url: str, api_version: str) -> ApiResponse:
    """Call a read-only GitHub endpoint without exposing the Authorization header."""
    request = urllib.request.Request(url, method=method)
    request.add_header("Authorization", f"Bearer {token}")
    request.add_header("Accept", "application/vnd.github+json")
    request.add_header("X-GitHub-Api-Version", api_version)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            raw = response.read().decode("utf-8", errors="replace")
            body = json.loads(raw) if raw else {}
            headers = {key.lower(): value for key, value in response.headers.items()}
            return ApiResponse(response.status, body, headers)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise CheckError(f"GitHub API returned HTTP {exc.code}: {safe_text(detail)}") from exc
    except urllib.error.URLError as exc:
        raise CheckError(f"GitHub API connection failed: {safe_text(exc.reason)}") from exc
    except json.JSONDecodeError as exc:
        raise CheckError("GitHub API returned invalid JSON") from exc


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True, help="GitHub repository in owner/name form")
    parser.add_argument("--token-env", default=DEFAULT_TOKEN_ENV, help=f"token environment variable (default: {DEFAULT_TOKEN_ENV})")
    parser.add_argument("--expires-at-env", default=DEFAULT_EXPIRY_ENV, help=f"expiry environment variable (default: {DEFAULT_EXPIRY_ENV})")
    parser.add_argument("--expires-at", help="expiry date; prefer the environment variable for shell history safety")
    parser.add_argument("--warn-days", type=int, default=30, help="warning threshold in days (default: 30)")
    parser.add_argument("--api-url", default=DEFAULT_API, help="GitHub API base URL")
    parser.add_argument("--api-version", default=DEFAULT_API_VERSION)
    parser.add_argument("--json", action="store_true", dest="as_json", help="print a machine-readable JSON report")
    parser.add_argument("--allow-unknown-expiry", action="store_true", help="allow missing expiry metadata; not recommended")
    return parser


def validate_repo(repo: str) -> None:
    if not re.fullmatch(r"[^/\s]+/[^/\s]+", repo):
        raise CheckError("--repo must use owner/name format")


def check(args: argparse.Namespace) -> tuple[int, dict[str, Any]]:
    if args.warn_days < 0:
        raise CheckError("--warn-days must be zero or greater")
    validate_repo(args.repo)
    token = os.environ.get(args.token_env)
    if not token:
        raise CheckError(f"missing token environment variable: {args.token_env}")

    expiry_value = args.expires_at or os.environ.get(args.expires_at_env)
    expiry: dt.date | None = parse_expiry(expiry_value) if expiry_value else None
    today = dt.datetime.now(dt.timezone.utc).date()
    days_remaining = (expiry - today).days if expiry else None
    if expiry and days_remaining < 0:
        expiry_status = "expired"
    elif expiry and days_remaining <= args.warn_days:
        expiry_status = "expiring-soon"
    elif expiry:
        expiry_status = "healthy"
    else:
        expiry_status = "unknown"
        if not args.allow_unknown_expiry:
            raise CheckError(f"missing expiry metadata: set {args.expires_at_env}")

    base = args.api_url.rstrip("/")
    repo_url = f"{base}/repos/{args.repo}"
    user = api_request(token, "GET", f"{base}/user", args.api_version)
    repository = api_request(token, "GET", repo_url, args.api_version)
    workflows = api_request(token, "GET", f"{repo_url}/actions/workflows", args.api_version)

    repo_permissions = repository.body.get("permissions")
    report: dict[str, Any] = {
        "status": "ok" if expiry_status == "healthy" else expiry_status,
        "checkedAt": dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
        "tokenEnv": args.token_env,
        "repository": args.repo,
        "account": user.body.get("login"),
        "expiry": expiry.isoformat() if expiry else None,
        "daysRemaining": days_remaining,
        "expiryStatus": expiry_status,
        "api": {
            "user": user.status == 200,
            "repository": repository.status == 200,
            "actions": workflows.status == 200,
        },
        "repositoryPermissions": repo_permissions if isinstance(repo_permissions, dict) else None,
        "workflowsVisible": workflows.body.get("total_count") if isinstance(workflows.body.get("total_count"), int) else None,
        "advisory": "Read-only checks confirm authentication and endpoint access; they do not prove write permission without performing a write.",
    }

    if expiry_status == "expired":
        return 10, report
    if not (user.status == 200 and repository.status == 200 and workflows.status == 200):
        return 12, report
    return 0, report


def print_report(report: dict[str, Any], as_json: bool) -> None:
    if as_json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return
    print(f"GitHub token check: {report['status']}")
    print(f"Account: {report.get('account') or '[unknown]'}")
    print(f"Repository: {report['repository']}")
    print(f"Expiry: {report['expiry'] or 'unknown'}")
    if report["daysRemaining"] is not None:
        print(f"Days remaining: {report['daysRemaining']}")
    print(f"API access: user={report['api']['user']} repository={report['api']['repository']} actions={report['api']['actions']}")
    if report.get("repositoryPermissions"):
        print(f"Repository permissions reported by API: {json.dumps(report['repositoryPermissions'], sort_keys=True)}")
    print(report["advisory"])


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        code, report = check(args)
        print_report(report, args.as_json)
        if report.get("expiryStatus") == "expiring-soon":
            print(f"warning: token expires in {report['daysRemaining']} day(s)", file=sys.stderr)
        return code
    except CheckError as exc:
        print(f"error: {safe_text(exc)}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
