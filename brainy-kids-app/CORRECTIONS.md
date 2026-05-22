# Corrections appliquées — Brainy Kids App

## Bug 1 : `npm ci` échoue au build backend (CRITIQUE)

**Cause :** Le fichier `BackEnd/package-lock.json` était désynchronisé avec `package.json`.
Il ne contenait que 55 entrées (générées pour un projet prisma-seul) alors que `package.json`
déclare l'intégralité des dépendances NestJS (~300+ packages).

**Fix :** 
- `BackEnd/Dockerfile` : remplacement de `npm ci` → `npm install` (stages builder ET production)
- Suppression du `package-lock.json` corrompu (Docker en génèrera un propre au build)

## Bug 2 : Frontend inaccessible sur `localhost:3001`

**Cause :** Le service `frontend` dans `docker-compose.yml` n'exposait aucun port vers l'hôte.
Il était uniquement accessible en interne via nginx sur le port 80.

**Fix :**
- Ajout de `ports: - "3001:3001"` dans le service `frontend` de `docker-compose.yml`
- Le frontend est maintenant accessible directement sur `http://localhost:3001`
  ET via nginx sur `http://localhost` (port 80)

## Résumé des fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `BackEnd/Dockerfile` | `npm ci` → `npm install` (2 occurrences) |
| `BackEnd/package-lock.json` | Supprimé (obsolète/corrompu) |
| `docker-compose.yml` | Ajout `ports: "3001:3001"` au service frontend |

## Commande de lancement

```bash
docker compose up --build -d
```

Le frontend sera accessible sur :
- `http://localhost` (via nginx, recommandé)
- `http://localhost:3001` (accès direct)

L'API backend sur :
- `http://localhost/api` (via nginx)
- `http://localhost:4000/api` (accès direct)
- `http://localhost:4000/api/docs` (Swagger UI)
