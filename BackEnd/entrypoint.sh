#!/bin/sh
# ================================================================
# entrypoint.sh — Brainy Kids Backend
# Stratégie : prisma db push lit schema.prisma directement.
# Aucune dépendance aux fichiers migration → zéro risque P3015.
# ================================================================

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║      🚀 Brainy Kids — Démarrage API          ║"
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
  echo "   Tentative $TRIES/$MAX_TRIES — nouvelle tentative dans 2s..."
  sleep 2
done

if [ "$TRIES" -ge "$MAX_TRIES" ]; then
  echo "❌ PostgreSQL inaccessible. Abandon."
  exit 1
fi
echo "✅ PostgreSQL prêt"

# ── 2. Synchroniser le schéma (db push) ────────────────────────
# db push lit schema.prisma et crée/modifie les tables directement.
# Contrairement à migrate deploy, il n'a AUCUNE dépendance aux
# fichiers migration.sql — impossible d'avoir un P3015.
echo ""
echo "📦 Synchronisation du schéma (db push)..."

set +e
npx prisma db push --accept-data-loss --skip-generate
PUSH_STATUS=$?
set -e

if [ "$PUSH_STATUS" != "0" ]; then
  echo "❌ db push échoué (code $PUSH_STATUS). Abandon."
  exit 1
fi
echo "✅ Schéma synchronisé"

# ── 3. Seed (idempotent) ────────────────────────────────────────
echo ""
echo "🌱 Vérification du seed..."
set +e
node prisma/seed.js
set -e
echo "✅ Seed OK"

# ── 4. Démarrer NestJS ──────────────────────────────────────────
echo ""
echo "▶️  Démarrage NestJS port 4000..."
echo ""
exec node dist/main
