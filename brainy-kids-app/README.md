# 🏫 Brainy Kids — Système de Gestion du Jardin d'Enfants

Application fullstack de gestion pour le jardin d'enfants **Brainy Kids** (Manouba, Ben Arous, Tunisie).

---

## 🏗️ Architecture

```
brainy-kids-app/
├── BackEnd/              # API NestJS + Prisma + PostgreSQL
├── FrontEnd/             # Interface Next.js + Tailwind CSS
├── nginx/
│   └── nginx.conf        # Reverse proxy
├── .github/
│   └── workflows/
│       └── cicd.yml      # CI/CD GitHub Actions
├── docker-compose.yml    # Orchestration Docker
├── Dockerfile.frontend   # Build Next.js
└── scripts/
    └── deploy.sh         # Script de déploiement
```

## 🚀 Lancement rapide (Docker)

### Prérequis
- Docker Desktop (Windows/Mac) ou Docker Engine (Linux)
- Git

### 1. Cloner et configurer
```bash
git clone https://github.com/Khmhamdi/brainy-kids-app.git
cd brainy-kids-app
cp .env.example .env
# Éditer .env selon vos besoins
```

### 2. Démarrer
```bash
# Option A — Script automatique
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Option B — Manuel
docker compose up -d --build
```

### 3. Accéder à l'application
| Service       | URL                          |
|---------------|------------------------------|
| Application   | http://localhost             |
| API Docs      | http://localhost/api/docs    |
| Base données  | localhost:5432               |

---

## 🔑 Comptes de connexion

| Rôle          | Utilisateur     | Mot de passe       |
|---------------|-----------------|--------------------|
| Admin         | admin           | admin123           |
| Directrice    | directrice      | directrice123      |
| Enseignante 1 | enseignante1    | enseignante123     |
| Enseignante 2 | enseignante2    | enseignante456     |
| Parent 1      | parent1         | parent1pass        |

---

## 📦 Modules fonctionnels

- ✅ **Authentification** JWT avec rôles (admin, teacher, parent)
- ✅ **Enfants** — Inscription, profil, dossier médical
- ✅ **Enseignantes** — Gestion, classes assignées
- ✅ **Parents** — Profil, enfants liés, historique paiements
- ✅ **Classes** — Petite/Moyenne section, effectifs
- ✅ **Paiements** — Frais de scolarité, clubs, cantine, trésorerie
- ✅ **Absences** — Saisie, suivi, taux de présence
- ✅ **Annonces** — Communication parents
- ✅ **Événements** — Planning, jours fériés
- ✅ **Dashboard** — Statistiques en temps réel, graphiques finance

---

## 🔧 Développement local (sans Docker)

### Backend
```bash
cd BackEnd
npm install
cp .env.example .env          # Configurer DATABASE_URL
npx prisma migrate deploy
npx prisma db seed
npm run start:dev              # Port 4000
```

### Frontend
```bash
cd FrontEnd
npm install
# Créer .env.local :
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api" > .env.local
npm run dev                    # Port 3000
```

---

## 🔄 CI/CD GitHub Actions

Le pipeline automatique fait :

1. **Tests** — Tests backend avec base de données PostgreSQL de test
2. **Lint** — Vérification du code frontend
3. **Build** — Construction des images Docker et push vers GHCR
4. **Deploy** — Déploiement SSH automatique sur le serveur

### Secrets GitHub à configurer
```
SERVER_HOST      # IP ou domaine du serveur
SERVER_USER      # Utilisateur SSH
SERVER_SSH_KEY   # Clé privée SSH
DB_PASSWORD      # Mot de passe PostgreSQL
JWT_SECRET       # Secret JWT
```

---

## 🔧 Commandes utiles

```bash
# Voir les logs
docker compose logs -f

# Redémarrer un service
docker compose restart backend

# Accéder à la DB
docker compose exec postgres psql -U bkadmin -d brainy_kids

# Relancer le seed
docker compose exec backend npx ts-node prisma/seed.ts

# Arrêter tout
docker compose down

# Arrêter et supprimer les données
docker compose down -v
```

---

## 📱 Technologies

| Couche     | Technologie                    |
|------------|--------------------------------|
| Frontend   | Next.js 14, Tailwind CSS, TypeScript |
| Backend    | NestJS 10, Prisma ORM, TypeScript |
| Base de données | PostgreSQL 16             |
| Auth       | JWT (JSON Web Token)           |
| Proxy      | Nginx Alpine                   |
| CI/CD      | GitHub Actions                 |
| Conteneurs | Docker + Docker Compose        |

---

Développé avec ❤️ pour **Brainy Kids** — Manouba, Tunisie 🇹🇳
