---
name: commit
description: Safe commit with mandatory secret scanning
disable-model-invocation: true
allowed-tools: Bash, Read, Grep
---

# Safe Commit Skill

Commit changes with mandatory secret scanning.

## Usage

```
/commit
Message: {commit message}
```

Or with staged files:
```
/commit
Files: {file list}
Message: {commit message}
```

## Process

### Step 1: Pre-Commit Checks

1. **Check for .env in staged files**
   ```bash
   git diff --cached --name-only | grep -E "^\.env$|\.env\.local$|\.env\.[^e]"
   ```
   If found: ABORT and warn user

2. **Scan for hardcoded secrets** in staged files
   Patterns to detect:
   - API keys: `sk_live_`, `sk_test_`, `api_key=`
   - AWS: `AKIA`, `aws_secret`
   - Generic: `password=`, `secret=`, `token=` followed by actual values
   - Base64 secrets: Long base64 strings in code

   ```bash
   git diff --cached | grep -iE "(api_key|secret|password|token)\s*[=:]\s*['\"][^'\"]{8,}"
   ```
   If found: ABORT and show matches

3. **Check .env.example is updated**
   If new env vars added to code, ensure they're documented

### Step 2: Stage Files (if specified)

```bash
git add {files}
```

### Step 3: Create Commit

```bash
git commit -m "{message}"
```

### Step 4: Verify

```bash
git log -1 --oneline
```

## Abort Conditions

The commit MUST be aborted if:
- `.env` or `.env.local` is staged
- Hardcoded secrets detected in diff
- Credential patterns found in new code

## Example Session

**Input:**
```
/commit
Message: Add feeding log feature
```

**Output:**
```
Pre-Commit Checks
=================
[PASS] No .env files staged
[PASS] No hardcoded secrets detected
[PASS] .env.example is current

Staged Files:
- src/services/feeding.service.ts
- src/services/feeding.service.test.ts
- src/app/(app)/reptiles/[id]/feedings/page.tsx

Committing...
[main abc1234] Add feeding log feature
 3 files changed, 245 insertions(+)
```

**If secrets detected:**
```
Pre-Commit Checks
=================
[PASS] No .env files staged
[FAIL] Hardcoded secrets detected!

Found in src/lib/api.ts:
  Line 15: const API_KEY = "sk_live_abc123..."

COMMIT ABORTED

Action Required:
1. Remove the hardcoded secret
2. Use process.env.API_KEY instead
3. Add API_KEY to .env.example with placeholder
4. Run /commit again
```
