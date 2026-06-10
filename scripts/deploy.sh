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

# Keep only the 30 most recent archives per container (across all dates)
for CONTAINER in smartlock-backend smartlock-frontend smartlock-caddy smartlock-postgres; do
  find "$STDOUT_ARCHIVE_DIR" -name "${CONTAINER}_*.log" -printf '%T@ %p\n' 2>/dev/null \
    | sort -rn \
    | awk 'NR>300 {print $2}' \
    | xargs -r rm -f
done

# ── Step 2: deploy ────────────────────────────────────────────────────────────
echo ""
echo "==> Deploying (build + restart)..."
cd "$PROJECT_DIR"
ENV_ARGS=""
[[ -f "$ENV_FILE" ]] && ENV_ARGS="--env-file $ENV_FILE"
# shellcheck disable=SC2086
docker compose -f "$COMPOSE_FILE" $ENV_ARGS up -d --build

# ── Step 3: wait for backend health, then reload Caddy ────────────────────────
# When backend/frontend containers restart, Caddy's Docker DNS cache goes stale
# and returns "server misbehaving" for ~2 minutes, causing real 502s. Reloading
# Caddy after the containers are healthy re-resolves all upstreams cleanly.
echo ""
echo "==> Waiting for backend to become healthy..."
DEADLINE=$(( $(date +%s) + 120 ))
until [ "$(docker inspect --format='{{.State.Health.Status}}' smartlock-backend 2>/dev/null)" = "healthy" ]; do
    if (( $(date +%s) > DEADLINE )); then
        echo "    WARNING: backend did not become healthy within 120s — skipping Caddy reload"
        break
    fi
    sleep 3
done
if [ "$(docker inspect --format='{{.State.Health.Status}}' smartlock-backend 2>/dev/null)" = "healthy" ]; then
    echo "    Backend healthy. Reloading Caddy to refresh DNS..."
    docker exec smartlock-caddy caddy reload --config /etc/caddy/Caddyfile 2>/dev/null \
        && echo "    Caddy reloaded." \
        || echo "    WARNING: Caddy reload failed — Caddy may still serve stale DNS briefly"
fi

echo ""
echo "==> Deploy complete. Persistent log volumes:"
echo "    Backend app logs : docker exec smartlock-backend ls /app/logs/"
echo "    Frontend nginx   : docker exec smartlock-frontend ls /var/log/nginx/"
echo "    Stdout archives  : $STDOUT_ARCHIVE_DIR/"
