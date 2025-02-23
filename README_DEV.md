# 📖 Guide pour les développeurs - Suivi de Consommation Électrique ⚡

Bienvenue dans le projet **Suivi de Consommation Électrique** !  
Ce fichier explique **comment configurer** votre environnement après un `git pull` et **les bonnes pratiques** pour éviter les conflits Git.

---

## 📌 Avant de commencer 🚀

### **1️⃣ Vérifier l'état du projet**
Avant de récupérer les nouvelles modifications, assurez-vous de ne pas avoir de modifications non enregistrées :
```bash
git status

Si vous avez des fichiers modifiés, vous pouvez :

Les committer :

git add .
git commit -m "Sauvegarde des modifications locales"
Les stocker temporairement pour ne pas perdre votre travail :

git stash
2️⃣ Récupérer les mises à jour
Une fois prêt, récupérez les dernières modifications du projet :


git pull origin main
Si vous avez fait un git stash, appliquez-le après le pull :


git stash pop
```


Installation des dépendances 📦
### 3️⃣ Installer les dépendances
Si de nouvelles dépendances ont été ajoutées, exécutez les commandes suivantes :

🔹 Backend
```
cd backend
npm install
```
🔹 Frontend
```
cd ../frontend
npm install
```


## Configuration 🛠️


### 4️⃣ Vérifier .env
Le fichier .env n'est pas versionné sur GitHub. Assurez-vous de bien l'avoir dans backend/ :

```

MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/nom_de_la_db
PORT=5000
```

⚠️ Remplacez user, password et nom_de_la_db par vos informations MongoDB.

## Remplissage de la base de données (optionnel) 🗄️
### 5️⃣ Si vous avez besoin de données de test
Si la base de données a été modifiée ou vidée, exécutez :

```
cd ../scripts
node seed.js
```

Cela ajoutera des exemples de mesures électriques dans MongoDB.


##Lancer le projet 🚀
### 6️⃣ Démarrer l'application
🔹 Lancer le backend
```

cd ../backend
npm start
s'assurer 
```

📡 L'API est disponible sur : http://localhost:5000

🔹 Lancer le frontend
Dans un nouveau terminal :

```

cd ../frontend
npm start
```

🖥️ L’interface est accessible sur : http://localhost:3000




## Bonnes pratiques Git 🛡️
### ✅ Toujours suivre ces étapes avant de committer :
1 - Récupérer les mises à jour avant de travailler :

```git pull origin main```


Faire un git status avant d'ajouter des fichiers :

`git status`


Commiter uniquement les fichiers que vous avez modifiés :

```
git add <fichier_modifié>
git commit -m "Ajout/modification de <fonctionnalité>"
```

Pousser les modifications sur GitHub :

```git push origin main```

## Résumé des étapes après un git pull 🔄

1️⃣ Faire un git pull pour récupérer les dernières mises à jour.
2️⃣ Installer les dépendances (npm install) dans backend/ et frontend/.
3️⃣ Créer ou mettre à jour .env si nécessaire.
4️⃣ Exécuter node scripts/seed.js (si besoin de données de test).
5️⃣ Lancer npm start dans backend/ et frontend/.
6️⃣ Toujours faire un git pull avant de committer pour éviter les conflits.

## En cas de conflit Git ❌
Si vous obtenez un conflit après un git pull, utilisez cette commande pour voir les conflits :


```git status ```


Ensuite, ouvrez les fichiers concernés, résolvez les conflits manuellement, puis :

```
git add .
git commit -m "Résolution des conflits"
git push origin main
```




---

### **📌 Explication des sections**
| Section | Description |
|---------|------------|
| `# 📖 Guide pour les développeurs` | Titre et introduction du guide. |
| `## 📌 Avant de commencer` | Instructions pour **vérifier l’état du projet** avant un `git pull`. |
| `## 📌 Installation des dépendances` | Commandes `npm install` pour **backend et frontend**. |
| `## 📌 Configuration` | Instructions pour créer et configurer le **fichier `.env`**. |
| `## 📌 Remplissage de la base de données` | Exécution de **`seed.js`** pour ajouter des données de test. |
| `## 📌 Lancer le projet` | Démarrer **backend et frontend** après installation. |
| `## 📌 Bonnes pratiques Git` | Explication des **commandes Git** à utiliser avant et après un `git pull`. |
| `## 📌 Résumé des étapes après un git pull` | **Liste des actions essentielles** après avoir mis à jour le projet. |
| `## 📌 En cas de conflit Git` | Explication de la **gestion des conflits** avec `git status`. |
| `## 📌 Besoin d’aide ?` | Encourage la communication dans l'équipe pour éviter les blocages. |

---

## **📌 Ce qu'il te reste à faire**
1. **Créer `README_DEV.md` dans `projet-suivi-consommation/`.**
2. **Coller le code ci-dessus.**
3. **Commiter et pousser sur GitHub pour que l’équipe puisse le voir.**
   ```bash
   git add README_DEV.md
   git commit -m "Ajout du guide pour les développeurs"
   git push origin main

## **📌 Se connecter au cluster (db sur le cloud)**
Changer dans le .env : ```MONGO_URI=mongodb+srv://powertrack:powertrack@powertrack.daxw9.mongodb.net/api```

Changer la structure du fichier mesures.js dans le dossier routes  de backend : 
```
const express = require("express");
const { getAllMesures, createMesure, deleteMesure } = require("../controllers/mesureController");
const router = express.Router();
// :pushpin: Récupérer toutes les mesures
router.get("/", getAllMesures);
// :pushpin: Ajouter une nouvelle mesure
router.post("/", createMesure);
// :pushpin: Supprimer une mesure par ID
router.delete("/:id", deleteMesure);
module.exports = router;```
```
Changer dans server.js dans backend : ```// Importer les routes API
const mesuresRoutes = require('./routes/mesures');
app.use('/api/mesures', mesuresRoutes);```

Changer dans le api.js du frontend dans le dossier services qui est dans le dossier sources : ```// Définition de l'URL du backend
const API_URL = 'http://localhost:5000/api';```
