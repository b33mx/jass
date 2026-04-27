#!/usr/bin/env bash
set -euo pipefail

cp -n .env.example .env || true
cp -n apps/backend/.env.example apps/backend/.env || true
cp -n apps/web/.env.example apps/web/.env || true

echo "Environment templates copied (if missing)."
