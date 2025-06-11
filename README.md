#  Powertrack

Une application web MERN pour suivre en temps réel la consommation électrique de ses appareils connectés via des multiprises intelligentes.

-  Projet réalisé dans le cadre du module de développement web 2024
-  [Vidéo de présentation sur YouTube](https://youtu.be/3IYCpe-y8Ic)

---

## Fonctionnalités principales

- Authentification JWT pour utilisateurs et Raspberry Pi
- Dashboard en temps réel avec mesures électriques toutes les 10s
- Gestion des appareils & multiprises connectées
- Notifications quotidiennes de consommation moyenne
- Page de profil avec modification sécurisée
- Réinitialisation de mot de passe & formulaire de contact
- Backend RESTful avec architecture claire (MVC)

---

## Stack Technique

### Frontend
- React.js
- Axios
- WebSocket natif pour le temps réel

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT pour l’authentification
- Nodemailer (emails), node-cron (notifications planifiées)

### Outils & Libs
- GitHub (CI/CD, versionnage)
- Jest (tests unitaires)
- Postman (tests manuels)
- MongoDB Compass (dev local)

---

## Installation locale

1. Clone du repo :
```bash
git clone https://github.com/rayleiighh/Dev-Web-2024.git
cd Dev-Web-2024
```

2. Backend :
```bash
cd backend
npm install
npm start
```

3. Frontend :
```bash
cd frontend
npm install
npm start
```

4. MongoDB :
- Lancer MongoDB localement
- Utiliser MongoDB Compass avec une base de donné en local

---

## Tests & Couverture

### Outil : Jest
- 11 suites de tests, 73 tests dont 60 réussis / 13 échoués
- Couverture : ~61 % globale
- Configuration dans `jest.config.test.js`

### Répartition par dossier
| Dossier      | Statements | Branches | Functions | Lines   |
|--------------|------------|----------|-----------|---------|
| controllers  | 51%        | 53%      | 41%       | 52%     |
| jobs         | 97%        | 100%     | 100%      | 96%     |
| middleware   | 100%       | 100%     | 100%      | 100%    |
| models       | 77%        | 0%       | 0%        | 80%     |
| services     | 100%       | 100%     | 100%      | 100%    |

### Exemples de cas testés
- Token manquant / invalide
- Ajout de consommation valide / invalide
- Retour d’état actif/inactif d’une multiprise

[Voir les tests dans le repo → backend/tests](https://github.com/rayleiighh/Dev-Web-2024/tree/main/backend/tests)

---

## API RESTful

Toutes les routes sont préfixées par `/api`

### /api/multiprises
```http
POST /api/multiprises
{
  "nom": "Multiprise Bureau",
  "identifiantUnique": "RASP_3"
}
```

###  /api/appareils
```http
POST /api/appareils
{
  "nom": "Prise 1",
  "multiprise": "ObjectId(...)"
}
```

### /api/consommations
```http
GET /api/consommations
Authorization: Bearer <token>
```

### /api/notifications
```http
POST /api/notifications/generer-infos
{
  "identifiantUnique": "RASP_3",
  "value": 60
}
```

### /api/utilisateurs
GET, POST, PUT, DELETE (authentifiés)

### /api/device-auth
POST (authentification des Raspberry Pi)

### /api/contact
POST (formulaire de contact)

---

## Choix techniques

- MERN stack pour une cohérence full-JS
- MongoDB pour flexibilité des données imbriquées
- JWT pour une authentification simple et sécurisée
- Architecture REST claire avec conventions
- WebSocket natif pour push en temps réel

---

## Contributeurs

- **Mohamed Mokhtar El Mazani** : Dashboard temps réel, logique back
- **Ben Lhaj Rayane** : Notifications planifiées, frontend soigné
- **Zebiri Saad** : Authentification, profil utilisateur
- **Khasan** : Réflexion, cohérence technique, recherche

---

## Limitations & Améliorations prévues

- Couverture de tests à améliorer (surtout dans les controllers)
- Documentation de l’API à finaliser (Swagger ou Markdown)
- Ajout d’un dashboard de statistiques avancées (v2)
- Tests d’intégration (Supertest) à implémenter
- Phase de tests de performance / charge à envisager

---

> Made by a smart & connected team – 2024
