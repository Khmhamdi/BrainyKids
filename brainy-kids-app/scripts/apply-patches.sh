#!/bin/bash
# =================================================================
# Script d'application des patches au projet Brainy Kids existant
# Lance depuis la racine du repo brainy-kids-app
# Usage : bash apply-patches.sh /chemin/vers/brainy-kids-app
# =================================================================

set -e

REPO=${1:-"."}
PATCHES_DIR="$(dirname "$0")/frontend-patch"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log_ok()   { echo -e "${GREEN}✅ $1${NC}"; }
log_info() { echo -e "${YELLOW}→  $1${NC}"; }

echo "🔧 Application des patches Brainy Kids..."
echo "   Repo cible : $REPO"
echo ""

FRONTEND="$REPO/FrontEnd"
BACKEND="$REPO/BackEnd"

# ─── 1. Copier le client API ─────────────────────────────────
log_info "Ajout du client API (lib/api.ts)"
cp "$PATCHES_DIR/api.ts" "$FRONTEND/src/lib/api.ts"
log_ok "lib/api.ts installé"

# ─── 2. Page de connexion ────────────────────────────────────
log_info "Ajout de la page de login"
mkdir -p "$FRONTEND/src/app/(auth)/sign-in"
cp "$PATCHES_DIR/sign-in-page.tsx" "$FRONTEND/src/app/(auth)/sign-in/page.tsx"
log_ok "Page sign-in installée"

# ─── 3. Composants connectés à l'API ─────────────────────────
log_info "Mise à jour des composants"
cp "$PATCHES_DIR/UserCard.tsx"        "$FRONTEND/src/components/UserCard.tsx"
cp "$PATCHES_DIR/AttendanceChart.tsx" "$FRONTEND/src/components/AttendanceChart.tsx"
cp "$PATCHES_DIR/Announcements.tsx"   "$FRONTEND/src/components/Announcements.tsx"
cp "$PATCHES_DIR/FinanceChart.tsx"    "$FRONTEND/src/components/FinanceChart.tsx"
log_ok "Composants mis à jour"

# ─── 4. next.config.mjs ──────────────────────────────────────
log_info "Mise à jour de next.config.mjs"
cp "$PATCHES_DIR/next.config.mjs" "$FRONTEND/next.config.mjs"
log_ok "next.config.mjs mis à jour (output: standalone)"

# ─── 5. Backend — Dockerfile ─────────────────────────────────
log_info "Ajout du Dockerfile Backend"
cp "$(dirname "$0")/backend/Dockerfile" "$BACKEND/Dockerfile"
log_ok "Dockerfile Backend installé"

# ─── 6. Backend — src complet ────────────────────────────────
log_info "Copie du code source Backend NestJS"
cp -r "$(dirname "$0")/backend/src/"* "$BACKEND/src/"
cp    "$(dirname "$0")/backend/package.json" "$BACKEND/package.json"
cp    "$(dirname "$0")/backend/tsconfig.json" "$BACKEND/tsconfig.json"
cp    "$(dirname "$0")/backend/nest-cli.json" "$BACKEND/nest-cli.json"
log_ok "Backend NestJS installé"

# ─── 7. Seed ─────────────────────────────────────────────────
if [ -f "$BACKEND/prisma/seed.ts" ]; then
  log_ok "Seed Prisma déjà présent"
else
  log_info "Seed manquant — à créer manuellement"
fi

# ─── 8. Infrastructure ───────────────────────────────────────
log_info "Copie des fichiers d'infrastructure"
cp "$(dirname "$0")/docker-compose.yml"    "$REPO/docker-compose.yml"
cp "$(dirname "$0")/.env.example"          "$REPO/.env.example"
cp "$(dirname "$0")/Dockerfile.frontend"   "$REPO/Dockerfile.frontend"
cp -r "$(dirname "$0")/nginx"              "$REPO/"
cp -r "$(dirname "$0")/.github"            "$REPO/"
cp -r "$(dirname "$0")/scripts"            "$REPO/"
cp "$(dirname "$0")/README.md"             "$REPO/README.md"
log_ok "Infrastructure installée"

# ─── 9. .env ─────────────────────────────────────────────────
if [ ! -f "$REPO/.env" ]; then
  cp "$REPO/.env.example" "$REPO/.env"
  log_ok ".env créé depuis .env.example (à personnaliser !)"
fi

# ─── 10. .gitignore ──────────────────────────────────────────
if ! grep -q ".env" "$REPO/.gitignore" 2>/dev/null; then
  echo -e "\n# Secrets\n.env\n*.local\n" >> "$REPO/.gitignore"
  log_ok ".gitignore mis à jour"
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║      ✅ Tous les patches appliqués avec succès ! ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Prochaines étapes :                             ║"
echo "║  1. cd $REPO                                     ║"
echo "║  2. nano .env   (configurer les secrets)         ║"
echo "║  3. docker compose up -d --build                 ║"
echo "║  4. Ouvrir http://localhost                       ║"
echo "╚══════════════════════════════════════════════════╝"
