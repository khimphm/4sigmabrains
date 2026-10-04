#!/usr/bin/env sh
# Khôi phục database từ file .sql.gz (GHI ĐÈ dữ liệu hiện có, hãy chắc chắn trước khi chạy).
#   DATABASE_URL=postgres://... ./infra/scripts/restore-db.sh backups/db-xxx.sql.gz
set -eu
: "${DATABASE_URL:?Cần đặt DATABASE_URL}"
FILE="${1:?Cần đường dẫn file .sql.gz}"
printf "Khôi phục %s vào database hiện tại? Gõ 'yes' để tiếp tục: " "$FILE"
read -r ok
[ "$ok" = "yes" ] || { echo "Đã huỷ"; exit 1; }
gunzip -c "$FILE" | docker run --rm -i postgres:17-alpine psql -v ON_ERROR_STOP=1 "$DATABASE_URL"
echo "Đã khôi phục"
