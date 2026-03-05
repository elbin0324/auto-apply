#!/usr/bin/env bash
# Pre-tool hook: blocks git commit on protected branches (dev, main).
# Reads tool input JSON from stdin. Exits 2 to block, 0 to allow.

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('command',''))" 2>/dev/null || echo "")

# Only check commands that look like git commit
if ! echo "$COMMAND" | grep -qE '\bgit\b.*\bcommit\b'; then
  exit 0
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

case "$BRANCH" in
  dev|main)
    echo "BLOCKED: Direct commits to '$BRANCH' are not allowed. Create a feature branch first." >&2
    exit 2
    ;;
  *)
    exit 0
    ;;
esac
