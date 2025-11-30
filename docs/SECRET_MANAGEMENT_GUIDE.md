# Voltaxe Secret Management Guide

## 🎯 Quick Reference

### ✅ DO's
- ✅ Use `.env.example` files with placeholder values
- ✅ Add `.env` to `.gitignore` before first commit
- ✅ Use environment variables for all secrets
- ✅ Rotate credentials every 90 days
- ✅ Use different credentials for dev/staging/production
- ✅ Store production secrets in a vault (AWS Secrets Manager, HashiCorp Vault)
- ✅ Enable 2FA on all external service accounts
- ✅ Use `git-secrets` or pre-commit hooks to prevent commits
- ✅ Review `git status` before committing
- ✅ Document all credential rotation in change logs

### ❌ DON'Ts
- ❌ **NEVER** commit `.env` files to version control
- ❌ **NEVER** hardcode secrets in source code
- ❌ **NEVER** share secrets via email/Slack/chat
- ❌ **NEVER** commit secrets to public repositories
- ❌ **NEVER** reuse secrets across environments
- ❌ **NEVER** leave default/weak passwords
- ❌ **NEVER** commit `config.json` or `secrets.json`
- ❌ **NEVER** store secrets in Docker images
- ❌ **NEVER** log secrets (even in debug mode)
- ❌ **NEVER** push secrets to CI/CD without encryption

---

## 🚀 Quick Setup

### 1. Initial Configuration
```bash
# Clone repository
git clone https://github.com/R-A-H-U-L-Kodez/Voltaxe.git
cd Voltaxe

# Verify .gitignore includes .env
grep -q "^\.env$" .gitignore && echo "✓ Safe" || echo "✗ Add .env to .gitignore!"

# Copy .env.example to .env
cp services/clarity_hub_api/.env.example services/clarity_hub_api/.env
cp services/cve_sync_service/.env.example services/cve_sync_service/.env

# Edit .env files with your actual secrets (never commit these!)
nano services/clarity_hub_api/.env
nano services/cve_sync_service/.env
```

---

### 2. Generate Secure Secrets

#### JWT Secret Key (64 characters)
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

#### PostgreSQL Password (32 characters)
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### VAPID Keys (Web Push)
```bash
python3 << EOF
from pywebpush import webpush
keys = webpush.generate_vapid_keys()
print(f"VAPID_PUBLIC_KEY={keys['public_key']}")
print(f"VAPID_PRIVATE_KEY={keys['private_key']}")
EOF
```

---

### 3. Verify Protection
```bash
# Test that .env is ignored
echo "TEST_SECRET=exposed" > test.env
git add test.env
git status | grep "test.env"
# Should not show up in staged files

# Clean up
rm test.env
```

---

## 🔐 Secret Types & Locations

### Database Credentials
```bash
# Location: services/clarity_hub_api/.env
DATABASE_URL=postgresql://voltaxe_user:PASSWORD@localhost:5432/voltaxe_clarity

# Security:
- Use strong passwords (20+ characters, alphanumeric + symbols)
- Different credentials for dev/staging/production
- Rotate every 90 days
- Never use default postgres user in production
```

### API Keys
```bash
# Supabase (services/clarity_hub_api/.env)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# NIST NVD (services/clarity_hub_api/.env, services/cve_sync_service/.env)
NIST_NVD_API_KEY=your-nvd-api-key
NVD_API_KEY=your-nvd-api-key

# Security:
- Keep keys confidential
- Monitor usage for anomalies
- Rotate if compromised
- Different keys per environment
```

### Authentication Secrets
```bash
# JWT (services/clarity_hub_api/.env)
JWT_SECRET_KEY=your-64-character-random-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=168

# Security:
- 64+ character random string
- Rotate every 90 days
- Invalidates all sessions on rotation
- Different secret per environment
```

### Notification Secrets
```bash
# VAPID Keys (services/clarity_hub_api/.env)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@yourdomain.com

# SendGrid (Optional)
SENDGRID_API_KEY=your-sendgrid-api-key

# Security:
- Generate new VAPID keys per environment
- Rotate if compromised
- SendGrid: Use API key with minimal permissions
```

---

## 🛡️ Pre-commit Hook Installation

Prevent accidental secret commits:

```bash
# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Voltaxe Secret Protection Pre-commit Hook

echo "🔍 Checking for secrets before commit..."

# Check for .env files
if git diff --cached --name-only | grep -qE "\.env$"; then
  echo ""
  echo "🚨 ERROR: Attempting to commit .env file!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "File(s) containing secrets detected:"
  git diff --cached --name-only | grep -E "\.env$" | sed 's/^/  ❌ /'
  echo ""
  echo "These files should NEVER be committed to version control."
  echo ""
  echo "What to do:"
  echo "  1. Unstage the file: git reset HEAD <file>"
  echo "  2. Ensure .env is in .gitignore"
  echo "  3. Use .env.example for documentation"
  echo ""
  exit 1
fi

# Check for common secret patterns
if git diff --cached | grep -qE "(password|secret|api_key|apikey|token|private_key).*=.*[a-zA-Z0-9]{20,}"; then
  echo ""
  echo "⚠️  WARNING: Potential secret detected in staged changes!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Please review your changes carefully."
  echo ""
  read -p "Continue with commit anyway? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "Commit aborted."
    exit 1
  fi
fi

echo "✓ No secrets detected. Proceeding with commit."
exit 0
EOF

# Make executable
chmod +x .git/hooks/pre-commit

echo "✓ Pre-commit hook installed!"
```

---

## 🔄 Credential Rotation Schedule

### Regular Rotation (Every 90 Days)
```bash
# Mark your calendar:
# - January 1, April 1, July 1, October 1

# Rotate in this order:
1. Database passwords
2. JWT secret keys
3. API keys (Supabase, NVD)
4. VAPID keys
5. SMTP credentials
```

### Emergency Rotation (If Compromised)
```bash
# Immediate actions (within 1 hour):
1. Rotate exposed credentials
2. Revoke old credentials
3. Restart affected services
4. Audit logs for unauthorized access
5. Document incident

# Follow-up (within 24 hours):
1. Clean git history (if needed)
2. Enable secret scanning
3. Review access logs
4. Notify affected users (if applicable)
```

---

## 📊 Secret Audit Checklist

Run this quarterly:

```bash
# 1. Check for committed secrets
git log --all --full-history -- **/.env | wc -l
# Should be 0 (or only from this incident)

# 2. Verify .gitignore
grep -E "^\.env$|^\*\.env$" .gitignore
# Should match .env patterns

# 3. Check for hardcoded secrets
grep -r "password\|secret\|api_key" --include="*.py" --include="*.js" . | grep -v ".env"
# Review results for hardcoded values

# 4. Verify local .env files exist
ls -la services/clarity_hub_api/.env
ls -la services/cve_sync_service/.env
# Should exist but NOT be tracked by git

# 5. Test secret rotation procedures
# Document last rotation dates and next scheduled rotation
```

---

## 🚨 If Secrets Are Exposed

### Immediate Steps (Within 1 Hour)
1. **Stop the bleeding:**
   ```bash
   git rm --cached <exposed-file>
   git commit -m "Remove exposed secrets from tracking"
   git push
   ```

2. **Rotate ALL exposed credentials immediately**
   - See detailed rotation guide in `SECURITY_INCIDENT_SECRETS_EXPOSED.md`

3. **Document the incident:**
   - What was exposed
   - For how long
   - Who had access
   - What actions were taken

### Follow-up Steps (Within 24 Hours)
1. **Clean git history** (optional but recommended)
2. **Enable secret scanning** (GitHub)
3. **Audit access logs** for unauthorized activity
4. **Implement prevention measures** (pre-commit hooks)

### Recovery Steps (Within 7 Days)
1. **Post-incident review**
2. **Update procedures**
3. **Team training**
4. **Implement monitoring**

---

## 🎓 Training Resources

### For Developers
- Read: `SECURITY_INCIDENT_SECRETS_EXPOSED.md`
- Understand: Why secrets should never be committed
- Practice: Secret rotation procedures
- Install: Pre-commit hooks on all projects

### For DevOps/SRE
- Implement: Secret management solution (AWS Secrets Manager, Vault)
- Configure: Secret scanning in CI/CD
- Monitor: API usage for anomalies
- Document: Rotation procedures

### For Security Team
- Audit: Quarterly secret audit
- Review: Access logs
- Test: Incident response procedures
- Train: Development team on best practices

---

## 📞 Support & Resources

### Internal
- Security Team: [Your security contact]
- Documentation: `/docs/SECURITY_INCIDENT_SECRETS_EXPOSED.md`
- Pre-commit Hook: `.git/hooks/pre-commit`

### External
- Supabase: https://supabase.com/support
- NIST NVD: nvd@nist.gov
- GitHub Secret Scanning: https://docs.github.com/en/code-security/secret-scanning

### Tools
- BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/
- git-secrets: https://github.com/awslabs/git-secrets
- truffleHog: https://github.com/trufflesecurity/truffleHog

---

## ✅ Status Dashboard

| Security Measure | Status | Last Updated |
|------------------|--------|--------------|
| .env in .gitignore | ✅ Enabled | 2025-12-01 |
| .env.example files | ✅ Created | 2025-12-01 |
| Pre-commit hooks | ⏳ Optional | - |
| Secret scanning | ⏳ Recommended | - |
| Last credential rotation | ⚠️ REQUIRED | - |
| Next scheduled rotation | ⏳ Pending | - |
| Incident response plan | ✅ Documented | 2025-12-01 |

---

**Last Updated:** December 1, 2025  
**Next Review:** March 1, 2026 (Quarterly)  
**Document Owner:** Security Team
