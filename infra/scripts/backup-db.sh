#!/usr/bin/env sh
# Sao lưu database ra file .sql.gz. Không cần cài Postgres, chỉ cần Docker.
#   DATABASE_URL=postgres://... ./infra/scripts/backup-db.sh [thu-muc]
set -eu
: "${DATABASE_URL:?Cần đặt DATABASE_URL}"
OUT_DIR="${1:-backups}"
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/db-$(date +%Y%m%d-%H%M%S).sql.gz"
docker run --rm postgres:17-alpine pg_dump --no-owner --no-privileges "$DATABASE_URL" | gzip > "$FILE"
echo "Đã sao lưu: $FILE"
