# Guide de Déploiement NexCRM - Configuration Environnement

Ce document explique comment gérer les variables d'environnement (`.env`) pour le déploiement.

## Frontend (React/Vite)

Le frontend utilise Vite. Les fichiers sont chargés selon le mode :
- `npm run dev` charge `.env.development` (par défaut)
- `npm run build` charge `.env.production` (par défaut)

### Étapes pour le déploiement :
1. Assurez-vous que `frontend/.env.production` contient l'URL correcte de l'API.
2. Exécutez `npm run build` dans le dossier `frontend`.
3. Le contenu du dossier `dist` est prêt à être servi par un serveur web (Nginx, Apache, etc.).

## Backend (Symfony)

Symfony utilise une hiérarchie de fichiers `.env`. 

### Étapes pour le déploiement :
1. **Sécurité** : Ne commitez jamais de secrets dans le dépôt.
2. Sur le serveur de production, créez un fichier `.env.local` (ou `.env.prod.local`) dans le dossier `backend`.
3. Définissez-y les variables sensibles :
   ```env
   APP_SECRET=un_secret_tres_long_et_aleatoire
   DATABASE_URL="postgresql://user:password@host:port/dbname?serverVersion=16&charset=utf8"
   MAILER_DSN=gmail://user:token@default
   ```
4. Optimisez pour la production :
   ```bash
   composer install --no-dev --optimize-autoloader
   composer dump-env prod
   ```

## Checklist Globale
- [ ] CORS configuré dans le backend pour autoriser le domaine du frontend.
- [ ] Clés JWT générées (`php bin/console lexik:jwt:generate-keypair`).
- [ ] Certificat SSL activé pour le frontend et le backend.
