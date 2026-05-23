#!/bin/sh
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   🛠️  Brainy Kids — Démarrage API DEV        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Attendre PostgreSQL ──────────────────────────────────────
echo "⏳ Attente de PostgreSQL..."
MAX_TRIES=30
TRIES=0

while [ "$TRIES" -lt "$MAX_TRIES" ]; do
  node -e "
    const { Client } = require('pg');
    const c = new Client({ connectionString: process.env.DATABASE_URL });
    c.connect().then(() => { c.end(); process.exit(0); }).catch(() => process.exit(1));
  " 2>/dev/null && break
  TRIES=$((TRIES + 1))
  sleep 2
done

echo "✅ PostgreSQL prêt"

# ── 2. Synchroniser le schéma ───────────────────────────────────
echo "📦 Synchronisation du schéma..."
npx prisma db push --accept-data-loss
echo "✅ Schéma synchronisé"

# ── 3. Seed ─────────────────────────────────────────────────────
echo "🌱 Vérification du seed..."
node prisma/seed.js
echo "✅ Seed OK"

# ── 4. Démarrer NestJS en mode DEV (hot reload) ─────────────────
# Nettoyer dist/ et le cache incremental pour forcer la recompilation
rm -rf dist tsconfig.tsbuildinfo
echo "▶️  Démarrage NestJS DEV..."
exec nest start --watch