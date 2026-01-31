#!/bin/bash
# Claude Code PreToolUse hook to check for secrets in git operations

# Get the command being run
COMMAND="$1"

# Check if this is a git add command that includes .env files
if [[ "$COMMAND" == *"git add"* ]]; then
  if [[ "$COMMAND" == *".env"* ]] && [[ "$COMMAND" != *".env.example"* ]]; then
    echo "ERROR: Cannot stage .env files. They contain secrets and are gitignored."
    echo ""
    echo "If you need to update environment variable documentation:"
    echo "  1. Update .env.example instead"
    echo "  2. Use placeholder values (not real secrets)"
    exit 1
  fi
fi

# Check if this is a git commit and .env is staged
if [[ "$COMMAND" == *"git commit"* ]]; then
  # Check for staged .env files
  STAGED_ENV=$(git diff --cached --name-only 2>/dev/null | grep -E "^\.env$|\.env\.local$|\.env\.[^e]" || true)
  if [[ -n "$STAGED_ENV" ]]; then
    echo "ERROR: Cannot commit with .env files staged:"
    echo "$STAGED_ENV"
    echo ""
    echo "Run 'git reset HEAD <file>' to unstage these files."
    exit 1
  fi

  # Check for hardcoded secrets in staged changes
  SECRETS_FOUND=$(git diff --cached 2>/dev/null | grep -iE "(api_key|secret|password|token)\s*[=:]\s*['\"][^'\"]{10,}" | head -5 || true)
  if [[ -n "$SECRETS_FOUND" ]]; then
    echo "ERROR: Potential hardcoded secrets detected in staged changes:"
    echo "$SECRETS_FOUND"
    echo ""
    echo "Use environment variables instead of hardcoded values."
    exit 1
  fi
fi

# All checks passed
exit 0
