#!/usr/bin/env bash
set -euo pipefail

# Scan only the checked-out version. Historical commits require credential rotation,
# not automated reuse or deletion by this script.
patterns=(
  'gh[pousr]_[A-Za-z0-9_]{20,}'
  '-----BEGIN (RSA|EC|OPENSSH|DSA|PRIVATE) KEY-----'
  'AKIA[0-9A-Z]{16}'
  'xox[baprs]-[0-9A-Za-z-]{20,}'
  'AIza[0-9A-Za-z_-]{30,}'
)

for pattern in "${patterns[@]}"; do
  if git grep --cached -n -I -E -e "$pattern" -- \
    ':!pnpm-lock.yaml' ':!*.lock' ':!*.map' ':!coverage/**' ':!dist/**' ':!build/**'; then
    echo "Credential-like pattern detected: $pattern" >&2
    exit 1
  fi
done

echo "Secret scan passed: no high-confidence credential patterns found in the indexed snapshot."
