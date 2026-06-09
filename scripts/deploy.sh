#!/usr/bin/env bash
# Production deploy script
# Saves current container stdout logs before rebuilding, so nothing is lost.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STDOUT_ARCHIVE_DIR="$PROJECT_DIR/logs/stdout-archives"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
ENV_FILE="$PROJECT_DIR/.env.prod"

mkdir -p "$STDOUT_ARCHIVE_DIR"

# ── Step 1: archive stdout logs from running containers ───────────────────────
echo "==> Archiving container stdout logs (${TIMESTAMP})..."
for CONTAINER in smartlock-backend smartlock-frontend smartlock-caddy smartlock-postgres; do
  if docker inspect "$CONTAINER" &>/dev/null 2>&1; then
    DEST="$STDOUT_ARCHIVE_DIR/${CONTAINER}_${TIMESTAMP}.log"
    docker logs "$CONTAINER" > "$DEST" 2>&1 || true
    SIZE=$(wc -c < "$DEST" 2>/dev/null || echo 0)
    if (( SIZE > 0 )); then
      echo "    Saved $CONTAINER stdout → $DEST ($(( SIZE / 1024 )) KB)"
    else
      rm -f "$DEST"
      echo "    $CONTAINER — no stdout output to archive"
    fi
  else
    echo "    $CONTAINER — not running, skipping"
  fi
done

# Keep only the 30 most recent archives per container to avoid unbounded disk use
find "$STDOUT_ARCHIVE_DIR" -name "*.log" -printf '%T@ %p\n' 2>/dev/null \
  | sort -rn \
  | awk 'BEGIN{c=""} {split($2,a,"_"); key=a[1]"_"a[2]; if(++count[key]>30) print $2}' \
  | xargs -r rm -f

# ── Step 2: deploy ────────────────────────────────────────────────────────────
echo ""
echo "==> Deploying (build + restart)..."
cd "$PROJECT_DIR"
ENV_ARGS=""
[[ -f "$ENV_FILE" ]] && ENV_ARGS="--env-file $ENV_FILE"
# shellcheck disable=SC2086
docker compose -f "$COMPOSE_FILE" $ENV_ARGS up -d --build

echo ""
echo "==> Deploy complete. Persistent log volumes:"
echo "    Backend app logs : docker exec smartlock-backend ls /app/logs/"
echo "    Frontend nginx   : docker exec smartlock-frontend ls /var/log/nginx/"
echo "    Stdout archives  : $STDOUT_ARCHIVE_DIR/"
