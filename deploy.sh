#!/bin/bash
set -euo pipefail

cd /opt/app
git fetch origin main
git reset --hard origin/main
sudo systemctl reload nginx
echo "Deployed $(git rev-parse --short HEAD) at $(date -u +%Y-%m-%dT%H:%M:%SZ)"