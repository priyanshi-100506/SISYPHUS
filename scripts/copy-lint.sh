#!/usr/bin/env bash
# fails if banned words appear in UI strings, docs, or README
PATTERN='seamless|effortless|powerful|robust|leverage|unlock|supercharge|elevate|empower|streamline|revolutioniz|cutting-edge|next-generation|game-changing|holistic|\bdelve\b|dive into|actionable insight|AI-powered|\boops\b|\bwhoops\b|in today.s|at the end of the day'
if grep -rniE "$PATTERN" frontend/src docs README.md backend/app/analysis --include='*.ts' --include='*.tsx' --include='*.md' --include='*.py'; then
  echo "Copy lint failed: remove banned phrases." && exit 1
else
  echo "Copy lint passed: zero banned phrases found."
fi
