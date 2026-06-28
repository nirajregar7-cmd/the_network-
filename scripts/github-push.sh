#!/usr/bin/env bash
set -e

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable is not set."
  echo "Add it as a Replit secret named GITHUB_TOKEN."
  exit 1
fi

REPO_URL="https://${GITHUB_TOKEN}@github.com/nirajregar7-cmd/the-network.git"

git remote set-url origin "$REPO_URL"

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Pushing branch '$BRANCH' to GitHub..."
git push origin "$BRANCH"

git remote set-url origin "https://github.com/nirajregar7-cmd/the-network"

echo "Done! Code pushed to GitHub successfully."
