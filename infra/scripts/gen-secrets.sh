#!/usr/bin/env sh
# In ra các khoá bí mật ngẫu nhiên để dán vào .env hoặc Render.
set -eu
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "CRON_SECRET=$(openssl rand -hex 24)"
echo "BACKUP_PASSPHRASE=$(openssl rand -base64 24)"
