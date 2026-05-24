FROM node:20-alpine
WORKDIR /app

# Installer les outils de build
RUN apk add --no-cache python3 make g++

# Créer l'utilisateur
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Installer les dépendances
COPY package.json ./
RUN npm install

# Copier tout le code source
COPY . .

# Générer Prisma
RUN npx prisma generate

# Compiler TypeScript avec nest build
RUN npm run build

# Vérifier que le build a bien produit les fichiers critiques
RUN test -f dist/main.js || (echo "ERROR: dist/main.js not found!" && exit 1) && \
    test -f dist/prisma/prisma.module.js || (echo "ERROR: dist/prisma/prisma.module.js not found — src/prisma/ excluded from build!" && exit 1) && \
    echo "✅ Build OK: dist/main.js + dist/prisma/prisma.module.js présents"

# Nettoyer les devDependencies
RUN npm prune --omit=dev

# Créer le dossier uploads et donner les droits à nestjs
RUN mkdir -p /app/uploads/photos && chown -R nestjs:nodejs /app/uploads

# Rendre l'entrypoint exécutable
RUN chmod +x entrypoint.sh

# Permissions
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 4000

# L'entrypoint gère : attente DB + migrations + seed + démarrage
CMD ["sh", "entrypoint.sh"]
