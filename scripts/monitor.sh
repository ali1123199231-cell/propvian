#!/usr/bin/env bash
# Smartlock log monitor — runs every 2 minutes via cron
# Checks for errors in docker logs and restarts unhealthy containers

set -euo pipefail

PROJECT_DIR="/home/x/E/IdeaProjects/smartlock2"
LOG_FILE="/home/x/E/IdeaProjects/smartlock2/scripts/monitor.log"
MAX_LOG_LINES=2000
CONTAINERS=("smartlock-backend" "smartlock-frontend")

# ── Helpers ───────────────────────────────────────────────────────────────────

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

trim_log() {
  if [[ -f "$LOG_FILE" ]]; then
    local lines; lines=$(wc -l < "$LOG_FILE")
    if (( lines > MAX_LOG_LINES )); then
      tail -n $((MAX_LOG_LINES / 2)) "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
    fi
  fi
}

# ── Check each container ──────────────────────────────────────────────────────

issues_found=0

for CONTAINER in "${CONTAINERS[@]}"; do
  # 1. Is the container running?
  STATUS=$(docker inspect --format '{{.State.Status}}' "$CONTAINER" 2>/dev/null || echo "missing")

  if [[ "$STATUS" != "running" ]]; then
    log "CRITICAL [$CONTAINER] Container is $STATUS — restarting"
    cd "$PROJECT_DIR" && docker compose up -d --no-deps "${CONTAINER//smartlock-/}" >> "$LOG_FILE" 2>&1 || true
    issues_found=1
    continue
  fi

  # 2. Health check (if configured)
  HEALTH=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CONTAINER" 2>/dev/null || echo "none")
  if [[ "$HEALTH" == "unhealthy" ]]; then
    log "WARNING [$CONTAINER] Health check unhealthy — restarting"
    docker restart "$CONTAINER" >> "$LOG_FILE" 2>&1 || true
    issues_found=1
    continue
  fi

  # 3. Scan last 2 minutes of logs for real errors (not DEBUG noise)
  ERRORS=$(docker logs "$CONTAINER" --since 2m 2>&1 \
    | grep -vE "\] (DEBUG|TRACE) " \
    | grep -E "(\] ERROR |\] WARN |NullPointerException|StackOverflowError|OutOfMemoryError|Connection refused|HikariPool.*dead|FlywayException|nginx.*\[error\])" \
    | grep -vE "(WARN.*booking_hold|WARN.*RepositoryConfig|WARN.*Flyway upgrade|WARN.*newer than this version)" \
    || true)

  if [[ -n "$ERRORS" ]]; then
    log "ISSUE [$CONTAINER] Errors detected in last 2 minutes:"
    echo "$ERRORS" | head -20 | while read -r line; do log "  >> $line"; done
    issues_found=1
  fi
done

# ── Summary ───────────────────────────────────────────────────────────────────

if (( issues_found == 0 )); then
  log "OK — all containers healthy"
fi

trim_log
