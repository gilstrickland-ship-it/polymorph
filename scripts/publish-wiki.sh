#!/usr/bin/env bash
# Publish the contents of wiki/ to the GitHub wiki repo.
#
# Why this script: GitHub wikis are git-backed but at a separate URL
# (<repo>.wiki.git). We can't push to it from arbitrary sandboxes (the integration
# environment's git proxy doesn't route to the wiki repo), so we hold the wiki
# source in-repo under wiki/ and let the maintainer publish from a machine with
# real GitHub credentials.
#
# Usage:
#   ./scripts/publish-wiki.sh                # publish to the canonical wiki repo
#   ./scripts/publish-wiki.sh --dry-run      # just diff against the remote wiki
#
# Prerequisites:
#   - You have push access to https://github.com/gilstrickland-ship-it/polymorph
#   - The wiki has been enabled in repo Settings → General → Features → Wikis
#   - Your local git can clone the wiki repo (SSH or HTTPS, with credentials)

set -euo pipefail

REPO_OWNER="gilstrickland-ship-it"
REPO_NAME="polymorph"
WIKI_URL="git@github.com:${REPO_OWNER}/${REPO_NAME}.wiki.git"
WIKI_URL_HTTPS="https://github.com/${REPO_OWNER}/${REPO_NAME}.wiki.git"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WIKI_SRC="${REPO_ROOT}/wiki"
DRY_RUN=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help)
      grep '^# ' "$0" | sed 's/^# //'
      exit 0
      ;;
  esac
done

if [[ ! -d "$WIKI_SRC" ]]; then
  echo "error: wiki source directory not found at $WIKI_SRC" >&2
  exit 1
fi

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

echo "→ Cloning wiki repo into $WORKDIR…"
if ! git clone --quiet "$WIKI_URL" "$WORKDIR/wiki" 2>/dev/null; then
  echo "  SSH clone failed, trying HTTPS…"
  if ! git clone --quiet "$WIKI_URL_HTTPS" "$WORKDIR/wiki"; then
    cat >&2 <<EOF
error: could not clone the wiki repo.

If this is the first time you're publishing, the wiki may not be initialised yet.
Create the first wiki page through the GitHub UI (any content — we'll overwrite it),
then re-run this script. The repo is:

  https://github.com/${REPO_OWNER}/${REPO_NAME}/wiki
EOF
    exit 1
  fi
fi

echo "→ Syncing wiki/ → cloned wiki…"
# Wikis use a flat directory; copy every .md file at top level of wiki/.
rsync -a --delete --exclude=.git "${WIKI_SRC}/" "${WORKDIR}/wiki/"

cd "$WORKDIR/wiki"

if git diff --quiet && git diff --cached --quiet; then
  echo "✓ wiki is already up to date — nothing to publish."
  exit 0
fi

if [[ "$DRY_RUN" == "1" ]]; then
  echo "→ Dry-run diff against remote wiki:"
  git --no-pager diff --stat
  exit 0
fi

git add -A
git -c user.name="Polymorph Wiki Publisher" \
    -c user.email="polymorph-wiki@noreply.local" \
    commit -m "docs(wiki): sync from repo wiki/ directory"

echo "→ Pushing to ${REPO_OWNER}/${REPO_NAME} wiki…"
git push origin master 2>/dev/null || git push origin main

echo "✓ wiki published — https://github.com/${REPO_OWNER}/${REPO_NAME}/wiki"
