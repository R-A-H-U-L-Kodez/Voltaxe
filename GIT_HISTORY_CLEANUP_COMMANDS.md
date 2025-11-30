# Git History Cleanup - Command Quick Reference

**⚠️ WARNING: DESTRUCTIVE - Force push required**

---

## 🔍 Step 1: Check for PII (5 minutes)

```bash
# Checkout a historical database file
git log --all --format="%H" -- "voltaxe_clarity.db" | head -1 > commit.txt
git checkout $(cat commit.txt) -- voltaxe_clarity.db

# Inspect for PII
sqlite3 voltaxe_clarity.db <<EOF
.tables
SELECT * FROM users LIMIT 5;
SELECT * FROM api_keys LIMIT 5;
.quit
EOF

# Cleanup
rm voltaxe_clarity.db commit.txt

# If you see emails, passwords, tokens → PII FOUND → Cleanup REQUIRED
```

---

## 🧹 Step 2: BFG Cleanup (30 minutes)

### Install BFG
```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y bfg

# macOS
brew install bfg

# Manual (Java required)
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
alias bfg='java -jar bfg-1.14.0.jar'
```

### Backup Repository
```bash
cd /tmp
git clone --bare https://github.com/R-A-H-U-L-Kodez/Voltaxe.git voltaxe-backup.git
```

### Clone Mirror for Cleanup
```bash
git clone --mirror https://github.com/R-A-H-U-L-Kodez/Voltaxe.git voltaxe-clean.git
cd voltaxe-clean.git
```

### Remove Bloat Files
```bash
# Remove binary executables
bfg --delete-files "*.exe" --no-blob-protection
bfg --delete-files "*.dll" --no-blob-protection
bfg --delete-files "*.so" --no-blob-protection
bfg --delete-files "*.dylib" --no-blob-protection

# Remove database files
bfg --delete-files "*.db" --no-blob-protection
bfg --delete-files "*.sqlite" --no-blob-protection

# Remove ML models
bfg --delete-files "*.joblib" --no-blob-protection
bfg --delete-files "*.pkl" --no-blob-protection
bfg --delete-files "*.pickle" --no-blob-protection

# Remove archives
bfg --delete-files "*.tar.gz" --no-blob-protection
bfg --delete-files "voltaxe_agent_deployment.tar.gz" --no-blob-protection

# Remove specific large files
bfg --delete-files "voltaxe_sentinel" --no-blob-protection
bfg --delete-files "voltaxe-sentinel-*" --no-blob-protection
```

### Cleanup and Optimize
```bash
# Expire reflog
git reflog expire --expire=now --all

# Aggressive garbage collection
git gc --prune=now --aggressive

# Check new size
du -sh .
# Should show: ~30-40MB (down from 91MB)
```

### Force Push
```bash
# Push cleaned history to GitHub
git push --force
```

---

## ✅ Step 3: Verify Cleanup (5 minutes)

```bash
# Check no bloat in history
git log --all --full-history --format="%H %s" -- "*.exe" | wc -l
# Should be: 0

git log --all --full-history --format="%H %s" -- "*.db" | wc -l
# Should be: 0

git log --all --full-history --format="%H %s" -- "*.joblib" | wc -l
# Should be: 0

# Check largest objects
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  awk '/^blob/ {if($3 > 1000000) print $3/1048576 "MB", $4}' | \
  sort -n | tail -10
# Should see: Nothing > 10MB

# Check repository size
cd /tmp
git clone https://github.com/R-A-H-U-L-Kodez/Voltaxe.git test-clean
du -sh test-clean/.git
# Should be: ~30-40MB
```

---

## 🔄 Step 4: Re-clone Locally (5 minutes)

```bash
# Save uncommitted work
cd /home/rahul/Voltaxe
git stash save "Before history cleanup re-clone"

# Delete old repository
cd /home/rahul
rm -rf Voltaxe

# Fresh clone
git clone https://github.com/R-A-H-U-L-Kodez/Voltaxe.git
cd Voltaxe

# Restore stashed work (if any)
git stash list
# If you see stashes: They won't apply (history changed)
# Manually re-apply changes if needed

# Verify services
./start-voltaxe.sh
```

---

## 🛡️ Step 5: Install Protection (2 minutes)

```bash
cd /home/rahul/Voltaxe

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'HOOK'
#!/bin/bash
# Prevent committing binaries and bloat

BLOCKED="\.(exe|dll|so|dylib|db|sqlite|joblib|pkl|pickle|tar\.gz|zip)$"

if git diff --cached --name-only | grep -qE "$BLOCKED"; then
  echo "🚨 ERROR: Blocked binary/bloat files detected!"
  echo ""
  echo "Files blocked:"
  git diff --cached --name-only | grep -E "$BLOCKED"
  echo ""
  echo "Solutions:"
  echo "  - Binaries: Use GitHub Releases or S3"
  echo "  - ML Models: Use MLflow or DVC"
  echo "  - Databases: Use .sql dumps (gzipped)"
  echo ""
  exit 1
fi
HOOK

chmod +x .git/hooks/pre-commit

# Test hook
echo "test" > test.exe
git add test.exe
git commit -m "Test"
# Should be blocked with error message

# Cleanup test
git reset HEAD test.exe
rm test.exe
```

---

## 📧 Step 6: Notify Team

**Email Template:**
```
Subject: 🚨 Git History Cleanup Complete - ACTION REQUIRED

Team,

Git history cleanup is COMPLETE. Repository is now 60% smaller.

**IMMEDIATE ACTION REQUIRED:**

1. Save all uncommitted work
2. Delete your local Voltaxe directory
3. Fresh clone:
   git clone https://github.com/R-A-H-U-L-Kodez/Voltaxe.git
4. Run setup: npm install (or your process)

**CHANGES:**
- Repository: 91MB → 35MB
- Clone speed: 60s → 20s
- Bloat files removed from git history
- PII exposure eliminated

**BEFORE PUSHING NEW CODE:**
Git will now block binary files. Use these instead:
- Binaries → GitHub Releases
- ML Models → MLflow or DVC
- Databases → SQL dumps

Questions? Reply to this email.

Completed: [DATE/TIME]
```

---

## 🆘 Rollback (If Something Goes Wrong)

```bash
# If cleanup failed or something broke

# Option 1: Restore from backup mirror
cd /tmp/voltaxe-backup.git
git push --force --mirror https://github.com/R-A-H-U-L-Kodez/Voltaxe.git

# Option 2: Reset from reflog (if not pushed yet)
cd /tmp/voltaxe-clean.git
git reflog show --all | head -20
git reset --hard HEAD@{5}  # Choose appropriate reflog entry
git push --force

# Option 3: Everyone clones backup
# Distribute voltaxe-backup.git to team
```

---

## 📊 Before/After Comparison

```bash
# Before cleanup
du -sh .git                    # 91MB
git count-objects -vH          # Many large objects
git log --all -- "*.exe" | wc -l  # Multiple commits

# After cleanup
du -sh .git                    # ~35MB ✅
git count-objects -vH          # Fewer objects
git log --all -- "*.exe" | wc -l  # 0 ✅
```

---

## 🎯 One-Liner Commands

```bash
# Check if cleanup needed
git rev-list --objects --all | git cat-file --batch-check | awk '/^blob/ {if($3>10000000) print $3/1048576"MB",$4}' | sort -n

# Quick size check
du -sh .git

# Count bloat files in history
git log --all --pretty=format: --name-only -- "*.exe" "*.db" "*.joblib" | sort -u | wc -l

# Find largest objects
git rev-list --objects --all | git cat-file --batch-check | sort -k3 -n | tail -10

# Verify no bloat after cleanup
git ls-tree -r -l --full-tree HEAD | awk '{if($4>10000000) print $4/1048576"MB",$5}'
```

---

## ✅ Success Checklist

After running all steps:
- [ ] Repository size < 40MB
- [ ] `git log -- "*.exe"` returns empty
- [ ] `git log -- "*.db"` returns empty
- [ ] `git log -- "*.joblib"` returns empty
- [ ] Fresh clone takes < 30 seconds
- [ ] All services start normally
- [ ] Pre-commit hook installed
- [ ] Team notified and re-cloned
- [ ] Backup repository saved

---

**Total Time:** ~40 minutes  
**Difficulty:** Medium (requires force push)  
**Risk:** Medium (requires team coordination)  
**Result:** 60% smaller repository + PII exposure eliminated
