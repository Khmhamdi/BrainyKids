#!/bin/bash
# =================================================================
# Script de déploiement Brainy Kids
# Usage : chmod +x deploy.sh && ./deploy.sh
# =================================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        🚀 BRAINY KIDS — Déploiement          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ─── Couleurs ───────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_ok()   { echo -e "${GREEN}✅ $1${NC}"; }
log_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }
log_err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ─── Prérequis ──────────────────────────────────────────────────
command -v docker &>/dev/null || log_err "Docker non installé. https://docs.docker.com/install"
command -v git    &>/dev/null || log_err "Git non installé."

log_ok "Docker $(docker --version | cut -d' ' -f3)"

# ─── Fichier .env ───────────────────────────────────────────────
if [ ! -f .env ]; then
  log_info "Création du fichier .env depuis .env.example"
  cp .env.example .env
  echo ""
  echo "⚠️  IMPORTANT : Éditez le fichier .env avant de continuer"
  echo "   - Changez DB_PASSWORD"
  echo "   - Changez JWT_SECRET"
  echo ""
  read -p "Appuyez sur Entrée pour continuer avec les valeurs par défaut..."
fi

# ─── Build et lancement ─────────────────────────────────────────
log_info "Construction des images Docker..."
docker compose build --no-cache

log_info "Démarrage des services..."
docker compose up -d

# ─── Attente que la DB soit prête ───────────────────────────────
log_info "Attente de la base de données..."
until docker compose exec -T postgres pg_isready -U bkadmin -d brainy_kids &>/dev/null; do
  echo -n "."
  sleep 2
done
echo ""
log_ok "PostgreSQL prêt"

# ─── Seed initial ───────────────────────────────────────────────
log_info "Chargement des données initiales (seed)..."
docker compose exec -T backend sh -c "cd /app && npx ts-node prisma/seed.ts" 2>/dev/null || \
  log_info "Seed déjà appliqué ou ignoré"

# ─── Résumé ─────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        ✅ Brainy Kids est opérationnel !      ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  🌐 Application   : http://localhost          ║"
echo "║  📚 API Swagger   : http://localhost/api/docs ║"
echo "║  🗄️  Base données  : localhost:5432            ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Comptes de connexion :                       ║"
echo "║  👑 admin / admin123                          ║"
echo "║  👩‍🏫 enseignante1 / enseignante123              ║"
echo "║  👨‍👩‍👧 parent1 / parent1pass                     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
