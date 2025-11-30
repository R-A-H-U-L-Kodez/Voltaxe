# Git History Cleanup - Quick Start Guide

**⏱️ Time Required:** 15-30 minutes  
**💾 Repo Size:** 91MB → ~35MB (60% reduction)  
**⚠️ Risk:** DESTRUCTIVE - All team members must re-clone

---

## 🚨 Before You Start

### 1. **Backup Everything**
```bash
# Clone a backup copy
git clone https://github.com/R-A-H-U-L-Kodez/Voltaxe.git voltaxe-backup

# Or create local backup
cp -r /home/rahul/Voltaxe /home/rahul/Voltaxe-backup-$(date +%Y%m%d)
```

### 2. **Notify Team**
Send message:
> 🚨 **GIT HISTORY CLEANUP STARTING**  
> Repository will be rewritten. After cleanup:  
> - Delete your local copy  
> - Re-clone from GitHub  
> - Estimated time: 30 minutes  
> - Start time: [YOUR TIME]

### 3. **Check Prerequisites**
```bash
# Python 3
python3 --version

# Pip
pip3 --version

# Git
git --version
```

---

## 🔄 Method 1: BFG Repo-Cleaner (RECOMMENDED)

### Step 1: Install BFG
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install bfg

# macOS
brew install bfg

# Or download JAR
# https://rtyley.github.io/bfg-repo-cleaner/
```

### Step 2: Clone Mirror
```bash
cd /tmp
git clone --mirror https://github.com/R-A-H-U-L-Kodez/Voltaxe.git voltaxe-clean.git
cd voltaxe-clean.git
```

### Step 3: Run BFG
```bash
# Remove binary executables
bfg --delete-files "*.exe" --no-blob-protection

# Remove database files
bfg --delete-files "*.db" --no-blob-protection

# Remove ML models
bfg --delete-files "*.joblib" --no-blob-protection

# Remove tar archives
bfg --delete-files "*.tar.gz" --no-blob-protection

# Remove pickle files
bfg --delete-files "*.pkl" --no-blob-protection
```

### Step 4: Cleanup
```bash
# Expire reflog
git reflog expire --expire=now --all

# Aggressive garbage collection
git gc --prune=now --aggressive

# Check new size
du -sh .
# Should see: ~30-40MB (down from 91MB)
```

### Step 5: Force Push
```bash
# Push cleaned history
git push --force

# Verify
git log --all --full-history -- "*.exe" "*.db" "*.joblib"
# Should be empty
```

### Step 6: Re-clone Locally
```bash
# Delete old repository
rm -rf /home/rahul/Voltaxe

# Fresh clone
cd /home/rahul
git clone https://github.com/R-A-H-U-L-Kodez/Voltaxe.git

# Verify size
cd Voltaxe
du -sh .git
# Should see: ~30-40MB
```

---

## 🔧 Method 2: git-filter-repo (Alternative)

### Step 1: Install
```bash
pip3 install git-filter-repo
```

### Step 2: Backup
```bash
cd /home/rahul/Voltaxe
cp -r .git .git.backup
```

### Step 3: Filter Repository
```bash
# Remove binaries
git filter-repo --path-glob '*.exe' --invert-paths --force
git filter-repo --path-glob '*.dll' --invert-paths --force
git filter-repo --path-glob '*.so' --invert-paths --force

# Remove databases
git filter-repo --path-glob '*.db' --invert-paths --force
git filter-repo --path-glob '*.sqlite' --invert-paths --force

# Remove ML models
git filter-repo --path-glob '*.joblib' --invert-paths --force
git filter-repo --path-glob '*.pkl' --invert-paths --force

# Remove archives
git filter-repo --path-glob '*.tar.gz' --invert-paths --force
git filter-repo --path-glob 'voltaxe_agent_deployment.tar.gz' --invert-paths --force
```

### Step 4: Re-add Remote
```bash
git remote add origin https://github.com/R-A-H-U-L-Kodez/Voltaxe.git
```

### Step 5: Force Push
```bash
git push --force --all
git push --force --tags
```

---

## 📋 Verification Checklist

### After Cleanup
```bash
# 1. Check repository size
du -sh .git
# Expected: ~30-40MB (was 91MB)

# 2. Verify no bloat in history
git log --all --full-history --format="%H %s" -- "*.exe"
git log --all --full-history --format="%H %s" -- "*.db"
git log --all --full-history --format="%H %s" -- "*.joblib"
# All should return empty

# 3. Check largest objects
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  awk '/^blob/ {if($3 > 1000000) print $3, $4}' | \
  sort -n
# Should see nothing > 10MB

# 4. Fresh clone test
cd /tmp
git clone https://github.com/R-A-H-U-L-Kodez/Voltaxe.git test-clone
du -sh test-clone/.git
# Expected: ~30-40MB

# 5. Verify working directory
cd test-clone
npm install  # or your build process
./start-voltaxe.sh  # Verify services start
```

---

## 🛡️ Post-Cleanup: Install Protection

### Pre-commit Hook
```bash
cd /home/rahul/Voltaxe

cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Prevent committing binaries and bloat

BLOCKED_PATTERNS="\.(exe|dll|so|dylib|db|sqlite|joblib|pkl|tar\.gz)$"

if git diff --cached --name-only | grep -qE "$BLOCKED_PATTERNS"; then
  echo "🚨 ERROR: Attempting to commit binary/bloat files!"
  echo ""
  echo "Blocked files:"
  git diff --cached --name-only | grep -E "$BLOCKED_PATTERNS"
  echo ""
  echo "These files should NOT be committed to git."
  echo "- Binaries → Use GitHub Releases"
  echo "- ML Models → Use MLflow or DVC"
  echo "- Databases → Use SQL dumps (.sql.gz)"
  echo ""
  echo "If you MUST commit large files, use Git LFS:"
  echo "  git lfs track '*.joblib'"
  echo ""
  exit 1
fi

echo "✅ No binary/bloat files detected"
EOF

chmod +x .git/hooks/pre-commit

# Test hook
touch test.exe
git add test.exe
git commit -m "Test"
# Should be blocked ✅
```

---

## 📧 Team Notification Template

```
Subject: 🚨 URGENT: Git Repository Cleanup - Action Required

Team,

We've completed a git history cleanup to remove 60MB of bloat 
(binaries, databases, ML models) from the repository.

ACTION REQUIRED:
1. Save any uncommitted work
2. Delete your local Voltaxe directory
3. Fresh clone: git clone https://github.com/R-A-H-U-L-Kodez/Voltaxe.git
4. Run: npm install (or your setup process)

NEW REPOSITORY SIZE:
- Before: 91MB
- After: ~35MB
- Clone speed: 50-60% faster

CHANGES:
- Git history rewritten (removed bloat files)
- Current code unchanged
- .gitignore enhanced to prevent future bloat

TIMELINE:
- Completed: [DATE/TIME]
- Old repository backup: voltaxe-backup-20251201.tar.gz

Questions? Contact: [YOUR NAME]
```

---

## 🆘 Rollback (If Something Goes Wrong)

### If Using BFG
```bash
# You have the original mirror
cd /tmp/voltaxe-clean.git

# Reset to original state
git reflog show --all
git reset --hard HEAD@{1}  # or specific commit

# Force push original history back
git push --force
```

### If Using git-filter-repo
```bash
cd /home/rahul/Voltaxe

# Restore from backup
rm -rf .git
cp -r .git.backup .git

# Force push original
git push --force --all
```

### If All Else Fails
```bash
# Restore from backup clone
rm -rf /home/rahul/Voltaxe
cp -r /home/rahul/voltaxe-backup-20251201 /home/rahul/Voltaxe
cd /home/rahul/Voltaxe
git push --force --all
```

---

## ⏱️ Timeline

### Full Cleanup (Estimated)
```
1. Backup:           5 minutes
2. Install BFG:      2 minutes
3. Clone mirror:     3 minutes
4. Run BFG:          5 minutes
5. Cleanup/GC:       5 minutes
6. Force push:       3 minutes
7. Re-clone:         2 minutes
8. Verify:           5 minutes
--------------------------------------
Total:              30 minutes
```

---

## 📊 Before vs After

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| .git size | 91MB | ~35MB | 60% smaller |
| Clone time | 60s | 20s | 65% faster |
| Largest object | 29MB | <1MB | 95% smaller |
| Binaries in history | ~68MB | 0MB | ✅ Removed |
| PII exposure | 🔴 High | ✅ None | ✅ Secure |

---

## ✅ Success Criteria

After cleanup, you should have:
- [ ] Repository .git size < 40MB
- [ ] No files >10MB in git history
- [ ] Fresh clone takes < 30 seconds
- [ ] All services start normally
- [ ] Pre-commit hook blocks binaries
- [ ] Team re-cloned successfully

---

## 🔗 Resources

- BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/
- git-filter-repo: https://github.com/newren/git-filter-repo
- Git LFS: https://git-lfs.github.com/
- DVC (Data Version Control): https://dvc.org/

---

**Last Updated:** December 1, 2025  
**Cleanup Status:** 📋 Ready to Execute  
**Risk Level:** ⚠️ High (Force push required)  
**Estimated Time:** 30 minutes
