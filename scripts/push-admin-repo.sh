#!/usr/bin/env bash
# Push admin-backend, admin-web, and shared-types to incloser-admin.git
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! git remote get-url admin &>/dev/null; then
  git remote add admin https://github.com/projjwalsen/incloser-admin.git
fi

CURRENT="$(git rev-parse --abbrev-ref HEAD)"
trap 'git checkout "$CURRENT" 2>/dev/null || true' EXIT

if git show-ref --verify --quiet refs/heads/admin-publish; then
  git checkout admin-publish
  git rm -rf --cached . 2>/dev/null || true
  git checkout "$CURRENT" -- admin-backend admin-web shared-types
  git add admin-backend admin-web shared-types
  if git diff --cached --quiet; then
    echo "No admin changes to publish."
  else
    git commit -m "Sync admin stack from ${CURRENT}"
  fi
else
  git checkout --orphan admin-publish
  git reset
  git add admin-backend admin-web shared-types
  git commit -m "Admin stack: backend, web, shared-types"
fi

git push -u admin admin-publish:main
git checkout "$CURRENT"
echo "Pushed to https://github.com/projjwalsen/incloser-admin.git (main)"
