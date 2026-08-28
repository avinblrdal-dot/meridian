#!/usr/bin/env bash
# Auto-push: stage everything, commit with a timestamp, and push to GitHub.
# GitHub push -> Vercel auto-deploys. Run it with:  ./push.sh   (or: npm run push)
set -e
cd "$(dirname "$0")"

git add -A

# Nothing changed? Don't make an empty commit.
if git diff --cached --quiet; then
  echo "✓ Nothing to push — already up to date."
  exit 0
fi

git commit -m "Update $(date '+%Y-%m-%d %H:%M')"
git push
echo "✓ Pushed. Vercel is deploying."
