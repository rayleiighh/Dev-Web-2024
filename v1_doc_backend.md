Backend MERN – API REST Node.js/Express & MongoDB (Mongoose)
Dans ce qui suit, nous générons un backend MERN (MongoDB, Express.js, React, Node.js) basé sur le diagramme UML fourni. Ce backend implémente une API RESTful avec des opérations CRUD pour chaque entité du diagramme, inclut une fonctionnalité clé (notifications par e-mail en cas de dépassement d'un seuil de consommation), utilise JWT pour l’authentification des utilisateurs, suit une architecture MVC, gère les erreurs/validations et documente les endpoints.
Structure du projet
Voici la structure proposée pour le projet backend, organisée par responsabilités (architecture MVC) :
plaintext
Copier
Modifier
backend/
├── config/
│   └── db.js                 # Configuration de la connexion à la base de données MongoDB
├── middleware/
│   └── auth.js               # Middleware d'authentification JWT
├── models/
│   ├── utilisateurModel.js   # Modèle Mongoose pour les utilisateurs
│   ├── appareilModel.js      # Modèle Mongoose pour les appareils
│   ├── consommationModel.js  # Modèle Mongoose pour les consommations
│   └── notificationModel.js  # Modèle Mongoose pour les notifications
├── controllers/
│   ├── utilisateurController.js   # Logique métier pour utilisateurs (inscription, login, etc.)
│   ├── appareilController.js      # Logique métier pour appareils (CRUD, on/off, etc.)
│   ├── consommationController.js  # Logique métier pour consommations (enregistrement, calcul, etc.)
│   └── notificationController.js  # Logique métier pour notifications (CRUD, envoi, etc.)
├── routes/
│   ├── utilisateurRoutes.js   # Endpoints API pour utilisateurs (authentification, gestion utilisateurs)
│   ├── appareilRoutes.js      # Endpoints API pour appareils
│   ├── consommationRoutes.js  # Endpoints API pour consommations
│   └── notificationRoutes.js  # Endpoints API pour notifications
└── server.js                 # Point d'entrée de l'application, configuration d'Express et des routes
Chaque dossier/fichier a un rôle bien défini : models contient les schémas de données, controllers contient la logique métier et le traitement des requêtes, routes définit les endpoints de l'API et connecte les requêtes aux controllers, middleware contient des fonctions intermédiaires (comme l’authentification JWT) et config gère la configuration (ici la connexion à MongoDB). Le fichier server.js initialise l’application Express, connecte la base de données, applique les middleware et monte les routes. Nous allons parcourir chaque composant du projet, avec le code correspondant et des explications détaillées.
Modèles Mongoose (schémas de données)
Les modèles de données décrivent les entités du diagramme UML sous forme de schémas Mongoose. Chaque schéma définit les champs (avec type, contraintes, etc.) et les relations entre entités via des références. Les modèles correspondent aux entités Utilisateur, Appareil, Consommation et Notification du diagramme.
Modèle Utilisateur (models/utilisateurModel.js)
Le modèle Utilisateur représente les utilisateurs de l’application (compte utilisateur). D’après le diagramme UML, un Utilisateur a des attributs comme nom, prénom, email, mot de passe, etc., et des méthodes associées (ajouter/supprimer un appareil, afficher historique, etc.). Dans notre backend, nous nous concentrons sur les données et le rôle de l'utilisateur dans l'API : informations de profil et crédentials pour l’authentification. Nous incluons également la référence aux appareils de l'utilisateur (relation "un utilisateur possède plusieurs appareils").
javascript
Copier
Modifier
// models/utilisateurModel.js

const mongoose = require('mongoose');

// Schéma Utilisateur
const utilisateurSchema = new mongoose.Schema({
  prenom: { type: String, required: true },               // Prénom de l'utilisateur
  nom:    { type: String, required: true },               // Nom de famille de l'utilisateur
  email:  { type: String, required: true, unique: true }, // Email (doit être unique pour chaque utilisateur)
  motDePasse: { type: String, required: true },           // Mot de passe haché de l'utilisateur
  appareils: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appareil' }] 
  // Liste des appareils associés à cet utilisateur (relations 1→N avec Appareil)
}, { timestamps: true });  // timestamps ajoute createdAt et updatedAt automatiquement

module.exports = mongoose.model('Utilisateur', utilisateurSchema);
Explications :
On utilise Mongoose pour définir le schéma de l’entité Utilisateur. Chaque utilisateur a un prenom, un nom, un email et un motDePasse.
Le champ email est marqué unique: true pour éviter les doublons en base (deux utilisateurs ne peuvent pas avoir le même email). Il sera aussi utilisé plus tard pour la connexion (login).
Le champ motDePasse contiendra le mot de passe haché (on ne stocke jamais de mot de passe en clair pour des raisons de sécurité). La gestion du hachage sera faite lors de l’inscription.
Le champ appareils est un tableau de références d'ObjectId pointant vers le modèle Appareil. Cela capture la relation « un utilisateur possède plusieurs appareils » (UML : 1 Utilisateur – n Appareils). Ainsi, on pourra facilement retrouver les appareils d’un utilisateur via une requête populée.
Le schéma utilise timestamps: true pour enregistrer automatiquement la date de création et de mise à jour de chaque document utilisateur (pratique pour des historiques).
À la fin, on exporte le modèle Mongoose créé (Utilisateur) pour pouvoir l’utiliser dans les controllers.
Modèle Appareil (models/appareilModel.js)
Le modèle Appareil représente un appareil électrique/électronique connecté (par exemple une prise intelligente) que l'utilisateur peut ajouter à son compte. Le diagramme UML suggère qu’un Appareil a un identifiant, possiblement un état (allumé/éteint), un seuil de consommation personnalisable, et qu’il est lié à des consommations et notifications.
javascript
Copier
Modifier
// models/appareilModel.js

const mongoose = require('mongoose');

const appareilSchema = new mongoose.Schema({
  nom:        { type: String, required: true },              // Nom de l'appareil (ex: "Lampe du salon")
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  // Référence à l'utilisateur propriétaire de l'appareil (relation N→1 vers Utilisateur)
  etat:       { type: Boolean, default: false },             // Etat actuel de l'appareil (true = allumé, false = éteint)
  seuilConso: { type: Number, default: 0 },                  // Seuil personnalisé de consommation (ex: en kWh) pour notifications
  modeNuit:   {
    actif:    { type: Boolean, default: false },             // Indicateur si le mode nuit est activé pour cet appareil
    heureDebut: { type: String },                            // Heure de début du mode nuit (format "HH:MM")
    heureFin:   { type: String }                             // Heure de fin du mode nuit
  }
}, { timestamps: true });

module.exports = mongoose.model('Appareil', appareilSchema);
Explications :
nom : un nom descriptif de l’appareil, fourni par l'utilisateur (obligatoire). Par exemple "Chauffage", "Frigo", ou "Lampe Salon".
utilisateur : champ référencé vers l’ObjectId d’un Utilisateur. Cela établit la relation inverse de l'utilisateur vers ses appareils (1 utilisateur – N appareils). Ce champ est requis: un appareil doit appartenir à un utilisateur.
etat : l'état actuel de l'appareil (true pour allumé, false pour éteint). Cela permet de représenter les méthodes du diagramme comme allumerPrise() et eteindrePrise() par une simple mise à jour de cet état. Par défaut, on considère l'appareil éteint lors de sa création (default: false).
seuilConso : un seuil de consommation (nombre) que l'utilisateur peut définir pour cet appareil. Par exemple, en kWh ou toute unité de consommation d'énergie. Si la consommation mesurée dépasse ce seuil, cela déclenchera une notification (c’est la fonctionnalité clé que nous allons implémenter). Par défaut, 0 (aucun seuil spécifique) pour éviter des notifications intempestives tant que l'utilisateur ne l'a pas configuré.
modeNuit : un sous-document qui regroupe les paramètres du mode nuit pour cet appareil. On inclut :
actif : booléen indiquant si le mode nuit est activé. Le diagramme mentionne activerModeNuit() et desactiverModeNuit(). Ici, on stocke simplement l'état.
heureDebut et heureFin : chaînes de caractères représentant l'heure de début et de fin du mode nuit (par ex "23:00" et "06:00"). On pourrait utiliser un type Date ou autre format, mais une simple string HH:MM est suffisante pour le concept. (Dans une application réelle, on mettrait en place un service pour éteindre/allumer automatiquement l’appareil entre ces heures.)
Comme pour Utilisateur, on utilise timestamps pour tracer création/mise à jour.
On exporte enfin le modèle Appareil.
Modèle Consommation (models/consommationModel.js)
Le modèle Consommation correspond à l’entité de consommation d’un appareil sur une période, d’après le diagramme UML. Un enregistrement de consommation peut contenir un début, une fin et une quantité consommée sur cette période. Il est relié à un appareil (et donc indirectement à un utilisateur). Cette entité permet de garder l'historique de l'énergie consommée par chaque appareil.
javascript
Copier
Modifier
// models/consommationModel.js

const mongoose = require('mongoose');

const consommationSchema = new mongoose.Schema({
  appareil:   { type: mongoose.Schema.Types.ObjectId, ref: 'Appareil', required: true },
  // Référence à l'appareil concerné par cette mesure de consommation
  debut:      { type: Date, required: true },   // Date/heure de début de la mesure
  fin:        { type: Date, required: true },   // Date/heure de fin de la mesure
  quantite:   { type: Number, required: true }  // Quantité d'énergie consommée sur la période (ex: en kWh)
}, { timestamps: true });

module.exports = mongoose.model('Consommation', consommationSchema);
Explications :
appareil : référence à l’ObjectId de l’Appareil associé. Ceci modélise la relation UML "Appareil 1 -- n Consommation" (un appareil peut avoir plusieurs enregistrements de consommation au cours du temps). Ce champ est obligatoire pour savoir quel appareil a généré cette consommation.
debut et fin : timestamps de début et fin de la période de mesure. Ils sont de type Date. Par exemple, on peut mesurer la consommation entre le 1er mars 12:00 et le 1er mars 14:00.
quantite : la quantité d’énergie consommée pendant la période [debut, fin], typiquement exprimée en kWh (ou l’unité choisie). C’est un nombre requis.
Ce modèle permettra de réaliser les fonctionnalités du diagramme liées à l’historique de consommation, calculs de moyenne (calculerMoyenne() sur une période, etc.) et export des données. Dans le cadre de notre API, nous fournissons les endpoints CRUD de base et un endpoint spécifique pour calculer la consommation moyenne (nous pourrions implémenter calculerMoyenne() en tant que requête de l’API, par exemple).
Après définition, on exporte le modèle Consommation.
Modèle Notification (models/notificationModel.js)
Le modèle Notification représente une alerte/notification envoyée à l'utilisateur, par exemple lorsque la consommation d’un appareil dépasse le seuil défini. Le diagramme UML indique qu’une Notification a un contenu (texte du message), un statut d’envoi (envoyée ou non) et des méthodes comme envoyerMail() et historiqueMails(). Dans notre backend, une notification sera créée lorsque l’événement le requiert (dépassement de seuil), et on pourra marquer son envoi par e-mail.
javascript
Copier
Modifier
// models/notificationModel.js

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  // Référence à l'utilisateur destinataire de la notification
  appareil:    { type: mongoose.Schema.Types.ObjectId, ref: 'Appareil', required: true },
  // Appareil concerné par la notification (ex: appareil qui dépasse le seuil)
  contenu:     { type: String, required: true },    // Contenu du message de notification
  envoyee:     { type: Boolean, default: false }    // Statut d'envoi de la notification (false = pas encore envoyée par email)
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
Explications :
utilisateur : référence vers l’Utilisateur qui doit recevoir la notification (généralement le propriétaire de l'appareil concerné). Ainsi on saura à quel utilisateur associer chaque notification.
appareil : référence vers l’Appareil lié à la notification. Par exemple, si la consommation de la Lampe Salon dépasse son seuil, la notification pointera cet appareil. Cela permet éventuellement d’afficher dans le message ou de filtrer les notifications par appareil.
contenu : le texte du message de la notification (par exemple "Alerte : votre Lampe Salon a consommé 5kWh, dépassant le seuil de 4kWh."). Ce champ est requis.
envoyee : un booléen indiquant si la notification a été envoyée par email (true si l'envoi email a été effectué, false sinon). Lors de la création, par défaut c’est false (notification en attente d'envoi). La méthode envoyerMail() enverrait l'email réel et passerait ce statut à true.
Avec timestamps, chaque notification garde sa date de création, ce qui permet la fonctionnalité historiqueMails() (lister l'historique des notifications envoyées). Dans l'API, on aura un endpoint pour consulter les notifications d’un utilisateur (on pourra filtrer celles déjà envoyées ou non, etc.).
On exporte le modèle Notification.
À ce stade, les modèles de données sont définis conformément au diagramme UML. On a formalisé les relations :
Un Utilisateur peut avoir plusieurs Appareils.
Un Appareil a plusieurs Consommation (historique),
et plusieurs Notification (alertes liées à cet appareil).
Une Notification est associée à un Utilisateur et un Appareil, pour informer l’utilisateur propriétaire de cet appareil.
Les méthodes mentionnées dans le diagramme (comme mesurerConsommation(), calculerMoyenne(), allumerPrise(), activerModeNuit(), etc.) seront réalisées via des endpoints de l’API qui manipulent ces modèles (par ex., un endpoint pour allumer/éteindre un appareil va modifier le champ etat). De même, envoyerMail() correspondra à un endpoint ou une action dans le controller de notification qui envoie l'email (ou simule son envoi).
Middleware d'authentification JWT
Avant de définir les routes et contrôleurs, configurons l’authentification par JWT (JSON Web Token). Le but est de protéger certaines routes pour qu’elles ne soient accessibles qu’à un utilisateur connecté disposant d’un token valide. Nous allons utiliser la stratégie suivante :
Lorsqu'un utilisateur se connecte avec succès, on génère un token JWT signé (contenant son ID d'utilisateur par exemple) et on le renvoie.
Pour chaque requête ultérieure aux routes protégées, le client devra inclure ce token (typiquement dans l'en-tête HTTP Authorization: Bearer <token>).
Le middleware JWT va vérifier la validité du token (signature et expiration) et, si valide, attacher les informations de l'utilisateur à la requête (par ex. son ID) et laisser passer la requête au contrôleur. Sinon, il renvoie une erreur 401 (Non autorisé).
Créons le fichier de middleware middleware/auth.js :
javascript
Copier
Modifier
// middleware/auth.js

const jwt = require('jsonwebtoken');
const SECRET_KEY = "votreSecretJWT";  // Clé secrète pour signer les tokens (à mettre en variable d'env en production)

// Middleware pour vérifier le token JWT
function verifAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  // Récupère le token après "Bearer "
  if (!token) {
    return res.status(401).json({ message: "Accès refusé : pas de token fourni" });
  }
  try {
    // Vérification et décodage du token
    const payload = jwt.verify(token, SECRET_KEY);
    // Attachons l'ID utilisateur décodé à la requête pour utilisation dans les controllers
    req.userId = payload.id;
    next(); // token valide, on passe au prochain middleware/contrôleur
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

module.exports = { verifAuth };
Explications :
On utilise le package jsonwebtoken (JWT) pour vérifier les tokens. SECRET_KEY est la clé secrète utilisée pour signer et vérifier les JWT (dans la pratique, elle serait stockée dans un fichier de configuration ou variable d'environnement, pour ne pas l'exposer dans le code source).
Le middleware verifAuth extrait le token JWT de l'en-tête Authorization de la requête. On s’attend à recevoir un header au format Authorization: Bearer <token> ; le code prend donc la deuxième partie après l’espace.
Si aucun token n’est présent, on renvoie une réponse 401 Unauthorized immédiatement.
Si un token est présent, on tente de le vérifier avec jwt.verify(token, SECRET_KEY). Si la signature n’est pas valide ou si le token est expiré, une exception sera levée, capturée par le catch, et on renvoie également 401.
Si la vérification réussit, jwt.verify retourne le payload du token (les données qu’on a encodées dedans lors de la génération). Dans notre cas, on y mettra l’identifiant de l’utilisateur. On attache donc req.userId = payload.id pour que les contrôleurs sachent quel utilisateur fait la requête.
Enfin, on appelle next() pour passer la main au contrôleur de la route protégée.
Ce middleware sera appliqué à toutes les routes qui nécessitent une authentification (par exemple les routes de gestion des appareils, consommations et notifications). Les seules routes non protégées seront celles d'inscription (register) et de connexion (login).
Contrôleurs et Routes Express (API REST)
Nous passons à la couche API REST. Pour chaque entité, nous allons définir des routes (endpoints) et leur logique métier dans des contrôleurs. Chaque route correspondra à une méthode CRUD ou à une action spécifique mentionnée dans le diagramme UML. Pour faciliter la compréhension, nous allons présenter les routes et contrôleurs par entité :
Utilisateur – Inscription, Connexion et gestion des utilisateurs
Les endpoints liés aux utilisateurs permettront de créer un nouvel utilisateur (inscription), de se connecter (authentification JWT), et éventuellement de récupérer/mettre à jour des informations de profil ou supprimer un utilisateur. Selon le diagramme, un utilisateur peut aussi ajouter/supprimer un autre utilisateur (ajouterUtilisateur(), supprimerUtilisateur() étaient mentionnés, ce qui pourrait correspondre à une fonctionnalité d'admin, mais nous resterons simples en supposant que chaque utilisateur gère son propre compte). Commençons par les routes utilisateur dans routes/utilisateurRoutes.js :
javascript
Copier
Modifier
// routes/utilisateurRoutes.js

const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateurController');
const { verifAuth } = require('../middleware/auth');

// Route d'inscription - crée un nouvel utilisateur
router.post('/register', utilisateurController.register);
// Route de connexion - authentifie l'utilisateur et renvoie un token
router.post('/login', utilisateurController.login);

// Routes protégées par JWT pour accéder/modifier le profil utilisateur
router.get('/me', verifAuth, utilisateurController.getMonProfil);         // Récupère les infos du profil de l'utilisateur connecté
router.put('/me', verifAuth, utilisateurController.updateMonProfil);      // Met à jour le profil de l'utilisateur connecté
router.delete('/me', verifAuth, utilisateurController.supprimerMonCompte); // Supprime le compte de l'utilisateur connecté

module.exports = router;
Explications (routes utilisateur) :
On importe Express et on crée un router. On importe le contrôleur utilisateur (utilisateurController) et le middleware d'authentification verifAuth.
POST /api/utilisateurs/register – route publique pour l’inscription d’un nouvel utilisateur. Cette route appelle la méthode register du contrôleur, qui va créer un utilisateur en base de données.
POST /api/utilisateurs/login – route publique pour la connexion. Elle appelle login dans le contrôleur, qui vérifiera les identifiants et retournera un JWT en cas de succès.
GET /api/utilisateurs/me – route protégée (on passe verifAuth en middleware) pour obtenir les informations du profil de l'utilisateur actuellement connecté (d’après le token). Cela permet par exemple d'afficher le tableau de bord ou les infos personnelles.
PUT /api/utilisateurs/me – route protégée pour modifier le profil de l'utilisateur connecté (changer son nom, email, mot de passe, etc.).
DELETE /api/utilisateurs/me – route protégée pour supprimer le compte de l'utilisateur (auto-suppression). En appelant cette route, l'utilisateur connecté peut supprimer définitivement son compte et ses données associées.
On n'a pas mis de route pour GET /api/utilisateurs (liste de tous les utilisateurs) ou GET /api/utilisateurs/:id parce que dans une application normale, ce serait réservé à un administrateur. Toutefois, le diagramme mentionnait possiblement qu'un utilisateur pouvait ajouterUtilisateur/supprimerUtilisateur, ce qui suggère des privilèges admin. Pour rester concentré sur l’essentiel, on se limite ici à la gestion du compte de l'utilisateur courant.
Enfin, on exporte le router pour l'utiliser dans server.js.
Maintenant, implémentons la logique dans le contrôleur utilisateur (controllers/utilisateurController.js). Ce contrôleur va utiliser le modèle Utilisateur et gérer l'inscription, la connexion, etc., en incluant le hachage de mot de passe et la génération de JWT.
javascript
Copier
Modifier
// controllers/utilisateurController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/utilisateurModel');
const SECRET_KEY = "votreSecretJWT";  // Même clé que dans le middleware auth

// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
  try {
    const { prenom, nom, email, motDePasse } = req.body;
    // Validation basique des entrées
    if (!prenom || !nom || !email || !motDePasse) {
      return res.status(400).json({ message: "Tous les champs sont requis (prenom, nom, email, motDePasse)." });
    }
    // Vérifier si l'email est déjà utilisé
    const utilisateurExiste = await Utilisateur.findOne({ email: email });
    if (utilisateurExiste) {
      return res.status(400).json({ message: "Un compte avec cet email existe déjà." });
    }
    // Hachage du mot de passe avant sauvegarde
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(motDePasse, saltRounds);
    // Créer et sauvegarder le nouvel utilisateur
    const nouvelUtilisateur = new Utilisateur({
      prenom,
      nom,
      email,
      motDePasse: hashedPassword
    });
    await nouvelUtilisateur.save();
    // On peut éventuellement générer un token tout de suite après l'inscription pour connecter directement l'utilisateur
    const token = jwt.sign({ id: nouvelUtilisateur._id }, SECRET_KEY, { expiresIn: '2h' });
    return res.status(201).json({ 
      message: "Inscription réussie", 
      token: token, 
      utilisateur: { id: nouvelUtilisateur._id, email: nouvelUtilisateur.email, nom: nouvelUtilisateur.nom, prenom: nouvelUtilisateur.prenom }
    });
  } catch (err) {
    console.error("Erreur lors de l'inscription:", err);
    res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
  }
};

// Connexion (authentification)
exports.login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    if (!email || !motDePasse) {
      return res.status(400).json({ message: "Email et mot de passe sont requis." });
    }
    // Chercher l'utilisateur par email
    const utilisateur = await Utilisateur.findOne({ email: email });
    if (!utilisateur) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }
    // Comparer le mot de passe fourni avec le hash stocké
    const match = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!match) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }
    // Générer un JWT valide
    const token = jwt.sign({ id: utilisateur._id }, SECRET_KEY, { expiresIn: '2h' });
    return res.status(200).json({ 
      message: "Connexion réussie",
      token: token,
      utilisateur: { id: utilisateur._id, email: utilisateur.email, nom: utilisateur.nom, prenom: utilisateur.prenom }
    });
  } catch (err) {
    console.error("Erreur lors de la connexion:", err);
    res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
};

// Récupérer le profil de l'utilisateur connecté
exports.getMonProfil = async (req, res) => {
  try {
    // Grâce au middleware, req.userId contient l'ID de l'utilisateur
    const utilisateur = await Utilisateur.findById(req.userId).select('-motDePasse').populate('appareils');
    // select('-motDePasse') exclut le champ motDePasse du résultat pour ne pas le renvoyer
    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.status(200).json(utilisateur);
  } catch (err) {
    console.error("Erreur récupération profil:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération du profil." });
  }
};

// Mettre à jour le profil de l'utilisateur connecté
exports.updateMonProfil = async (req, res) => {
  try {
    const updates = req.body; // { nom: 'NouveauNom', prenom: 'NouveauPrenom', ... }
    if (updates.motDePasse) {
      // S'il souhaite changer de mot de passe, on le hache aussi
      updates.motDePasse = await bcrypt.hash(updates.motDePasse, 10);
    }
    const utilisateurMisAJour = await Utilisateur.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true }).select('-motDePasse');
    // new: true -> retourne le document mis à jour, runValidators -> applique les validations du schéma
    res.status(200).json({ message: "Profil mis à jour avec succès", utilisateur: utilisateurMisAJour });
  } catch (err) {
    console.error("Erreur mise à jour profil:", err);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour du profil." });
  }
};

// Supprimer le compte de l'utilisateur connecté
exports.supprimerMonCompte = async (req, res) => {
  try {
    // Supprimer l'utilisateur
    await Utilisateur.findByIdAndDelete(req.userId);
    // (Optionnel) Supprimer ou anonymiser les données liées: appareils, consommations, notifications
    // Ici, pour simplifier, on pourrait laisser MongoDB supprimer en cascade si on a défini des référentiels "on delete"
    // Sinon, il faudrait supprimer manuellement les appareils de l'utilisateur, etc.
    res.status(200).json({ message: "Compte utilisateur supprimé avec succès" });
  } catch (err) {
    console.error("Erreur suppression compte:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression du compte." });
  }
};
Explications (contrôleur utilisateur) :
On importe bcrypt pour le hachage de mots de passe, jsonwebtoken pour les JWT, et le modèle Utilisateur. On définit la même SECRET_KEY que dans le middleware (dans une vraie application, on éviterait la duplication en la centralisant dans un fichier de config).
register (inscription) :
On extrait prenom, nom, email, motDePasse depuis req.body.
On fait quelques validations basiques : s’assurer que tous les champs requis sont présents. Sinon, on renvoie 400 (Bad Request) avec un message clair.
On vérifie si un utilisateur existe déjà avec cet email via Utilisateur.findOne({ email }). Si oui, on renvoie 400 indiquant que l’email est déjà utilisé.
Si tout est bon, on hache le mot de passe fourni avec bcrypt.hash. On utilise un salt de 10 tours (valeur courante pour bcrypt, équilibrant sécurité et performance). Cette opération est asynchrone.
On crée ensuite un nouvel objet Utilisateur avec les données (en remplaçant le motDePasse par sa version hachée), puis on le sauvegarde en base avec save().
Après inscription réussie, on peut générer un token JWT pour connecter directement l'utilisateur. On utilise jwt.sign en encodant l’ID utilisateur (payload = { id: nouvelUtilisateur._id }) et en signant avec la clé secrète. On définit une expiration, ici 2 heures (expiresIn: '2h').
On renvoie une réponse 201 (Created) avec un message de succès, le token, et éventuellement quelques infos du profil (id, email, nom, prenom) pour le frontend.
login (connexion) :
On extrait l’email et le motDePasse du corps de la requête. On vérifie leur présence (400 si manquants).
On cherche en base l'utilisateur avec cet email. Si non trouvé, on renvoie 401 (Unauthorized) sans préciser trop de détails (pour ne pas révéler si l’email existe, on reste vague : "email ou mot de passe incorrect").
Si l’utilisateur existe, on compare le mot de passe envoyé avec le hash stocké via bcrypt.compare. Si ça ne correspond pas, 401 également.
Si les identifiants sont valides, on génère un JWT de la même manière que lors de l'inscription (payload contenant l’ID utilisateur, même SECRET_KEY, expiration 2h).
On renvoie 200 (OK) avec un message de succès, le token, et éventuellement les infos de l’utilisateur. Le client front-end stockera ce token (p. ex. dans le localStorage ou en mémoire) pour l’envoyer dans les prochaines requêtes.
getMonProfil :
Grâce au middleware verifAuth, on sait que la requête est authentifiée et req.userId est l'ID de l'utilisateur.
On utilise Utilisateur.findById(req.userId) pour récupérer le document utilisateur en base. On chaîne select('-motDePasse') pour exclure le champ motDePasse (par sécurité, on ne veut jamais envoyer le hash, même s'il est hashé). On peut aussi utiliser .lean() éventuellement, mais pas obligatoire.
On peut appeler .populate('appareils') pour inclure la liste des appareils de l'utilisateur dans la réponse, si l'on souhaite fournir ces infos directement. Cela utilisera la référence définie dans le modèle Utilisateur. (Cela correspond un peu à la méthode afficherDonnees() ou afficherHistorique() du diagramme, car on renvoie toutes les données de l'utilisateur, y compris ses appareils).
Si l'utilisateur n’est pas trouvé (cas théorique si le token est d'un user supprimé, etc.), renvoyer 404. Sinon, renvoyer 200 avec les données utilisateur (JSON).
updateMonProfil :
On prend les champs à mettre à jour depuis req.body. On vérifie si motDePasse est dans ces champs, pour alors le hacher avant mise à jour (un utilisateur qui souhaite changer son mot de passe enverra le nouveau en clair, on le remplace par le hash pour stockage).
On utilise findByIdAndUpdate avec l'ID de l'utilisateur (toujours req.userId du token), en passant { new: true } pour retourner l'utilisateur mis à jour après modifications, et runValidators: true pour réappliquer les validations du schéma (par exemple, s'il change son email, s'assurer que le format et l'unicité sont respectés).
On exclut à nouveau le motDePasse du résultat. Puis on renvoie un message de succès et les nouvelles données.
supprimerMonCompte :
On supprime l’utilisateur avec findByIdAndDelete(req.userId).
On commente qu’idéalement, il faudrait aussi supprimer ou dissocier toutes les données liées à cet utilisateur : ses appareils, consommations, notifications (on pourrait par exemple supprimer les appareils qui ont ce user, ce qui en cascade supprimerait les consommations et notifications s’il y a des références, ou bien mettre en place un middleware Mongoose pre-remove). Pour simplifier, on omet ce détail ou on imagine que la base gère des cascades.
On renvoie un message confirmant la suppression. Après cela, le token précédemment délivré à cet utilisateur ne sera plus valable (s'il essaye de l'utiliser, le verifAuth trouvera plus l'utilisateur en base, ou on pourrait faire un blacklist, mais c'est avancé).
Nous avons ainsi couvert l'authentification JWT et le CRUD du modèle Utilisateur (inscription = Create, login = special case (Read/verify), get profile = Read, update profile = Update, delete account = Delete).
Appareil – CRUD, allumage/extinction et mode nuit
Pour les Appareils, on va créer des endpoints permettant de :
Ajouter un nouvel appareil (lié à l'utilisateur connecté).
Consulter la liste des appareils de l'utilisateur ou un appareil en particulier.
Mettre à jour un appareil (par exemple son nom ou son seuil).
Supprimer un appareil.
Actions spécifiques : allumer/éteindre l'appareil (modifier son état) et activer/désactiver le mode nuit.
Toutes ces routes seront protégées par JWT, car elles concernent des ressources utilisateurs. Assurons-nous que l'utilisateur ne puisse agir que sur ses propres appareils (on vérifiera que l'appareil manipulé appartient bien à req.userId). Routes dans routes/appareilRoutes.js :
javascript
Copier
Modifier
// routes/appareilRoutes.js

const express = require('express');
const router = express.Router();
const appareilController = require('../controllers/appareilController');
const { verifAuth } = require('../middleware/auth');

// Toutes les routes appareils sont protégées (besoin d'un token JWT valide)
router.use(verifAuth);

// Créer un nouvel appareil
router.post('/', appareilController.creerAppareil);

// Récupérer tous les appareils de l'utilisateur connecté
router.get('/', appareilController.getAppareils);

// Récupérer un appareil spécifique de l'utilisateur (par ID)
router.get('/:id', appareilController.getAppareilParId);

// Mettre à jour un appareil (ex: nom, seuilConso, etc.)
router.put('/:id', appareilController.updateAppareil);

// Supprimer un appareil
router.delete('/:id', appareilController.supprimerAppareil);

// Allumer un appareil (mettre etat = true)
router.put('/:id/on', appareilController.allumerAppareil);

// Éteindre un appareil (mettre etat = false)
router.put('/:id/off', appareilController.eteindreAppareil);

// Activer le mode nuit sur un appareil (fournir heureDebut/heureFin dans req.body)
router.put('/:id/mode-nuit/activer', appareilController.activerModeNuit);

// Désactiver le mode nuit sur un appareil
router.put('/:id/mode-nuit/desactiver', appareilController.desactiverModeNuit);

module.exports = router;
Explications (routes appareil) :
On applique router.use(verifAuth) en haut, ce qui veut dire que toutes les routes définies après nécessitent le middleware d'auth. C’est un moyen pratique d’éviter de répéter verifAuth pour chaque route. Ainsi, chaque requête à /api/appareils/... devra avoir un token valide.
POST / – créer un appareil. Pas de :id dans l'URL car l'ID sera généré lors de la création.
GET / – obtenir la liste de tous les appareils de l'utilisateur connecté. On ne retourne que ceux de l'utilisateur (le contrôleur filtrera par req.userId).
GET /:id – obtenir les détails d'un appareil donné (après vérification qu'il appartient à l'utilisateur).
PUT /:id – mettre à jour un appareil (tous champs modifiables, par exemple nom ou seuil).
DELETE /:id – supprimer un appareil. Cela pourrait aussi entraîner la suppression des consommations liées à cet appareil (à gérer côté base).
PUT /:id/on et PUT /:id/off – endpoints spécifiques pour changer l’état de l’appareil sans affecter les autres champs. C’est la réalisation des méthodes UML allumerPrise() et eteindrePrise(). On pourrait aussi faire cela via le endpoint général de mise à jour en envoyant { etat: true }, mais séparer en deux routes rend l’intention claire et correspond aux actions distinctes.
PUT /:id/mode-nuit/activer – pour activer le mode nuit sur l'appareil : on s’attend à recevoir dans req.body les paramètres nécessaires (heureDebut, heureFin). On utilise une URL distincte pour bien marquer l'action. (On aurait pu aussi faire un seul endpoint PUT /:id avec un objet modeNuit à jour, mais on suit la logique du diagramme).
PUT /:id/mode-nuit/desactiver – pour désactiver simplement le mode nuit (on pourrait mettre modeNuit.actif = false).
À présent, voici le contrôleur des appareils (controllers/appareilController.js) :
javascript
Copier
Modifier
// controllers/appareilController.js

const Appareil = require('../models/appareilModel');
const Consommation = require('../models/consommationModel'); // si besoin de supprimer conso liées
const Notification = require('../models/notificationModel'); // si besoin de notifier lors de changements

// Créer un nouvel appareil pour l'utilisateur connecté
exports.creerAppareil = async (req, res) => {
  try {
    const { nom, seuilConso, heureDebut, heureFin } = req.body;
    if (!nom) {
      return res.status(400).json({ message: "Le nom de l'appareil est requis." });
    }
    // Créer l'appareil avec l'utilisateur propriétaire (req.userId)
    const nouvelAppareil = new Appareil({
      nom: nom,
      utilisateur: req.userId,
      seuilConso: seuilConso || 0,
      // Si des heures de mode nuit sont fournies, on active le mode nuit
      modeNuit: {
        actif: heureDebut && heureFin ? true : false,
        heureDebut: heureDebut,
        heureFin: heureFin
      }
    });
    const appareilSauvegarde = await nouvelAppareil.save();
    res.status(201).json({ message: "Appareil créé", appareil: appareilSauvegarde });
  } catch (err) {
    console.error("Erreur création appareil:", err);
    res.status(500).json({ message: "Erreur serveur lors de la création de l'appareil." });
  }
};

// Récupérer tous les appareils de l'utilisateur connecté
exports.getAppareils = async (req, res) => {
  try {
    // Trouver tous les appareils dont le champ utilisateur correspond à req.userId
    const appareils = await Appareil.find({ utilisateur: req.userId });
    res.status(200).json(appareils);
  } catch (err) {
    console.error("Erreur récupération appareils:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des appareils." });
  }
};

// Récupérer un appareil spécifique (par ID) appartenant à l'utilisateur
exports.getAppareilParId = async (req, res) => {
  try {
    const appareilId = req.params.id;
    const appareil = await Appareil.findById(appareilId);
    if (!appareil) {
      return res.status(404).json({ message: "Appareil non trouvé." });
    }
    // Vérifier que l'appareil appartient bien à l'utilisateur connecté
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès refusé à cet appareil." });
    }
    res.status(200).json(appareil);
  } catch (err) {
    console.error("Erreur récupération appareil:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération de l'appareil." });
  }
};

// Mettre à jour un appareil
exports.updateAppareil = async (req, res) => {
  try {
    const appareilId = req.params.id;
    // Vérifier existence de l'appareil et appartenance
    let appareil = await Appareil.findById(appareilId);
    if (!appareil) {
      return res.status(404).json({ message: "Appareil non trouvé." });
    }
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès refusé : cet appareil n'appartient pas à l'utilisateur." });
    }
    // Mettre à jour les champs autorisés
    const { nom, seuilConso, etat, modeNuit } = req.body;
    if (nom !== undefined) appareil.nom = nom;
    if (seuilConso !== undefined) appareil.seuilConso = seuilConso;
    if (etat !== undefined) appareil.etat = etat;
    if (modeNuit !== undefined) {
      // modeNuit est un objet { actif, heureDebut, heureFin }
      appareil.modeNuit.actif = modeNuit.actif !== undefined ? modeNuit.actif : appareil.modeNuit.actif;
      appareil.modeNuit.heureDebut = modeNuit.heureDebut || appareil.modeNuit.heureDebut;
      appareil.modeNuit.heureFin = modeNuit.heureFin || appareil.modeNuit.heureFin;
    }
    const appareilMisAJour = await appareil.save();
    res.status(200).json({ message: "Appareil mis à jour", appareil: appareilMisAJour });
  } catch (err) {
    console.error("Erreur mise à jour appareil:", err);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour de l'appareil." });
  }
};

// Supprimer un appareil
exports.supprimerAppareil = async (req, res) => {
  try {
    const appareilId = req.params.id;
    const appareil = await Appareil.findById(appareilId);
    if (!appareil) {
      return res.status(404).json({ message: "Appareil non trouvé." });
    }
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Cet appareil n'appartient pas à l'utilisateur." });
    }
    // Supprimer l'appareil
    await Appareil.findByIdAndDelete(appareilId);
    // Supprimer les consommations liées à cet appareil, et notifications liées
    await Consommation.deleteMany({ appareil: appareilId });
    await Notification.deleteMany({ appareil: appareilId });
    res.status(200).json({ message: "Appareil supprimé avec succès" });
  } catch (err) {
    console.error("Erreur suppression appareil:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression de l'appareil." });
  }
};

// Allumer un appareil (mettre etat à true)
exports.allumerAppareil = async (req, res) => {
  try {
    const appareilId = req.params.id;
    const appareil = await Appareil.findById(appareilId);
    if (!appareil) return res.status(404).json({ message: "Appareil non trouvé." });
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès refusé à cet appareil." });
    }
    appareil.etat = true;
    await appareil.save();
    res.status(200).json({ message: "Appareil allumé (etat = true)", appareil });
  } catch (err) {
    console.error("Erreur allumage appareil:", err);
    res.status(500).json({ message: "Erreur serveur lors de l'allumage de l'appareil." });
  }
};

// Éteindre un appareil (mettre etat à false)
exports.eteindreAppareil = async (req, res) => {
  try {
    const appareilId = req.params.id;
    const appareil = await Appareil.findById(appareilId);
    if (!appareil) return res.status(404).json({ message: "Appareil non trouvé." });
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès refusé à cet appareil." });
    }
    appareil.etat = false;
    await appareil.save();
    res.status(200).json({ message: "Appareil éteint (etat = false)", appareil });
  } catch (err) {
    console.error("Erreur extinction appareil:", err);
    res.status(500).json({ message: "Erreur serveur lors de l'extinction de l'appareil." });
  }
};

// Activer le mode nuit sur un appareil (avec heures début/fin)
exports.activerModeNuit = async (req, res) => {
  try {
    const appareilId = req.params.id;
    const { heureDebut, heureFin } = req.body;
    if (!heureDebut || !heureFin) {
      return res.status(400).json({ message: "Veuillez fournir l'heureDebut et heureFin pour activer le mode nuit." });
    }
    const appareil = await Appareil.findById(appareilId);
    if (!appareil) return res.status(404).json({ message: "Appareil non trouvé." });
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Cet appareil n'appartient pas à l'utilisateur." });
    }
    // Mettre à jour le modeNuit
    appareil.modeNuit.actif = true;
    appareil.modeNuit.heureDebut = heureDebut;
    appareil.modeNuit.heureFin = heureFin;
    // On peut en plus éteindre l'appareil immédiatement si l'heure actuelle est dans la plage nuit.
    // (Ici on ne le fait pas explicitement, on se contente d'enregistrer les préférences)
    await appareil.save();
    res.status(200).json({ message: `Mode nuit activé pour l'appareil (de ${heureDebut} à ${heureFin})`, appareil });
  } catch (err) {
    console.error("Erreur activation mode nuit:", err);
    res.status(500).json({ message: "Erreur serveur lors de l'activation du mode nuit." });
  }
};

// Désactiver le mode nuit sur un appareil
exports.desactiverModeNuit = async (req, res) => {
  try {
    const appareilId = req.params.id;
    const appareil = await Appareil.findById(appareilId);
    if (!appareil) return res.status(404).json({ message: "Appareil non trouvé." });
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Cet appareil n'appartient pas à l'utilisateur." });
    }
    // Désactiver le mode nuit
    appareil.modeNuit.actif = false;
    // On peut décider de laisser heureDebut/heureFin tel quel ou les effacer
    // appareil.modeNuit.heureDebut = undefined;
    // appareil.modeNuit.heureFin = undefined;
    await appareil.save();
    res.status(200).json({ message: "Mode nuit désactivé pour l'appareil", appareil });
  } catch (err) {
    console.error("Erreur désactivation mode nuit:", err);
    res.status(500).json({ message: "Erreur serveur lors de la désactivation du mode nuit." });
  }
};
Explications (contrôleur appareil) :
On importe les modèles nécessaires : Appareil bien sûr, et également Consommation et Notification. Pourquoi ces deux derniers ? Parce qu'en supprimant un appareil, on décide de supprimer aussi ses consommations et notifications associées (nettoyage en cascade manuel, faute de contraintes référentielles directes dans MongoDB). De plus, on pourrait utiliser Notification pour émettre une alerte lors de certaines opérations sur l'appareil (par ex., si l’utilisateur allume/éteint manuellement ou active le mode nuit, cela pourrait envoyer une notification, mais ce n’est pas obligatoire).
creerAppareil :
Extrait les infos nécessaires du corps de requête : nom (obligatoire) et éventuellement seuilConso, heureDebut, heureFin.
Si le nom n’est pas fourni, renvoie 400.
Crée un nouvel objet Appareil. On renseigne le nom, on associe utilisateur: req.userId pour lier l’appareil à l'utilisateur connecté. On assigne seuilConso s'il est fourni (sinon 0 par défaut).
Pour le mode nuit, si l'appelant fournit heureDebut et heureFin, on active directement modeNuit.actif = true et on stocke ces heures. Sinon, on laisse le modeNuit.actif à false par défaut.
On sauvegarde l'appareil en base.
On retourne 201 avec le détail de l’appareil créé.
getAppareils :
Récupère tous les appareils de l'utilisateur connecté en filtrant Appareil.find({ utilisateur: req.userId }). On suppose que req.userId est bien défini par le middleware JWT (c’est le cas puisque toutes ces routes passent par verifAuth).
Renvoie le tableau d’appareils (peut être vide si l'utilisateur n’en a aucun).
(On pourrait .populate('utilisateur') si on voulait les détails du propriétaire, mais ici ce n’est pas nécessaire car c’est justement l’utilisateur courant).
getAppareilParId :
Récupère l’ID demandé via req.params.id.
Cherche l’appareil par ID avec findById.
Si non trouvé, 404.
S'il existe, on vérifie que son champ utilisateur correspond à req.userId (on fait toString() sur ObjectId pour comparer des strings). Si l'appareil n'appartient pas à l'utilisateur faisant la requête, on renvoie 403 Forbidden (tentative d'accès non autorisée à un appareil d’autrui).
Si tout va bien, on renvoie l'appareil (200).
updateAppareil :
Semblable à getAppareilParId au début : on récupère l'appareil, on check ownership, renvoie 404 ou 403 si besoin.
Ensuite, on extrait du corps les champs qui peuvent être mis à jour: nom, seuilConso, etat, modeNuit. On teste chaque champ pour ne changer que ceux qui sont présents ( != undefined).
Si nom dans le body, on met à jour.
Si seuilConso présent, on met à jour.
Si etat présent, on met à jour (cela permet de changer l'état via ce endpoint général aussi, même si on a des endpoints dédiés on/off).
Si modeNuit présent, on s'attend à ce que ce soit un objet possédant possiblement actif, heureDebut, heureFin. On met à jour chaque sous-champ s’il est fourni, sinon on garde la valeur existante (pour ne pas effacer une heureDebut si on ne la spécifie pas dans la requête, par exemple).
On sauvegarde l'appareil mis à jour et on renvoie 200 avec l'objet mis à jour.
supprimerAppareil :
Récupère l'appareil, vérifie propriété (comme précédemment).
S'il appartient bien au user, on le supprime via findByIdAndDelete.
Ensuite, on effectue un nettoyage : on supprime toutes les consommations associées à cet appareil (Consommation.deleteMany({ appareil: appareilId })) et toutes les notifications associées (Notification.deleteMany({ appareil: appareilId })). Ceci permet d’éviter de conserver des données orphelines liées à un appareil qui n’existe plus. (Dans un système plus évolué, on pourrait avoir configuré des cascade delete ou utiliser le middleware pre-remove Mongoose pour automatiser, mais ici on le fait explicitement).
Renvoie un message de succès.
allumerAppareil / eteindreAppareil :
Ces deux fonctions sont très similaires, seule la valeur d'état change. Dans chaque, on récupère l’appareil par ID, check propriétaire.
Puis on assigne appareil.etat = true (ou false) et on sauvegarde.
On renvoie un message confirmant l'action et l'objet appareil mis à jour.
Optionnellement, on pourrait à ce moment créer une Notification si, par exemple, l'allumage ou extinction était programmé ou important à notifier. Ici on ne le fait pas, car l'action est manuelle par l'utilisateur lui-même (pas besoin de notification).
activerModeNuit :
On s’attend à recevoir heureDebut et heureFin dans le corps (format HH:MM convenu). On valide leur présence, sinon 400. (On ne valide pas le format dans le détail ici, mais on pourrait).
On récupère l’appareil, check ownership.
On met à jour modeNuit.actif = true et enregistre les heures.
Commentaire : on pourrait implémenter que si l'heure courante se situe entre heureDebut et heureFin au moment de l'appel, on éteint l'appareil tout de suite pour respecter le mode nuit. Ceci nécessiterait d'accéder à l'heure actuelle (new Date() etc.) et de comparer. On ne le fait pas ici, mais on le mentionne en commentaire.
Sauvegarde et réponse 200 avec l'appareil. L'utilisateur peut ainsi enregistrer ses préférences de mode nuit. (Une tâche planifiée côté serveur devrait ensuite utiliser ces préférences pour automatiquement allumer/éteindre l’appareil aux heures voulues, mais c'est hors de notre simple API stateless).
desactiverModeNuit :
Récupère l’appareil, check ownership.
Met modeNuit.actif = false. On laisse éventuellement les heures en place (ainsi l'utilisateur pourrait réactiver plus tard sans ressaisir), ou on pourrait les effacer (on l’a mis en commentaire).
Sauvegarde et réponse.
Nous avons ainsi implémenté le CRUD complet des appareils ainsi que les actions spécifiques allumage/extinction et activation/désactivation du mode nuit, conformément au diagramme UML (méthodes allumerPrise(), eteindrePrise(), activerModeNuit(), desactiverModeNuit()).
Consommation – CRUD et calculs de consommation
Pour Consommation, les endpoints permettront d'enregistrer de nouvelles mesures de consommation pour un appareil, de lister l'historique des consommations, éventuellement de consulter/éditer/supprimer une mesure particulière. De plus, on inclura une route spéciale pour la fonctionnalité de calcul de moyenne sur une période (calculerMoyenne() mentionné dans le diagramme). Les routes seront protégées par JWT, et on devra vérifier que la consommation manipulée appartient à un appareil de l'utilisateur connecté (via l'association consommation -> appareil -> utilisateur). Routes routes/consommationRoutes.js :
javascript
Copier
Modifier
// routes/consommationRoutes.js

const express = require('express');
const router = express.Router();
const consommationController = require('../controllers/consommationController');
const { verifAuth } = require('../middleware/auth');

router.use(verifAuth);

// Créer un enregistrement de consommation pour un appareil (de l'utilisateur)
router.post('/', consommationController.creerConsommation);

// Récupérer toutes les consommations de l'utilisateur (tous appareils, ou filtrer par appareil via req.query.appareil)
router.get('/', consommationController.getConsommations);

// Récupérer une consommation spécifique par son ID
router.get('/:id', consommationController.getConsommationParId);

// Mettre à jour une consommation (ex: corriger quantite ou période)
router.put('/:id', consommationController.updateConsommation);

// Supprimer une consommation
router.delete('/:id', consommationController.supprimerConsommation);

// Calculer la consommation moyenne sur une période donnée pour un appareil
router.get('/moyenne/:appareilId', consommationController.calculerMoyenneConsommation);

module.exports = router;
Explications (routes consommation) :
On protège toutes les routes consommation par verifAuth également.
POST / – créer une nouvelle consommation. On attend dans le body au moins: appareil (ID de l'appareil concerné), debut, fin, quantite. Cette route enregistrera par exemple la consommation mesurée d'un appareil entre deux instants.
GET / – lister les consommations. On peut permettre un filtrage par appareil via une query string (par ex. GET /api/consommations?appareil=<ID>). On implémentera cela dans le contrôleur: si req.query.appareil est présent, on ne renvoie que les consommations de cet appareil, sinon on renvoie toutes les consommations de l'utilisateur (donc de tous ses appareils).
GET /:id – obtenir les détails d'un enregistrement de consommation particulier (après vérification de l'accès).
PUT /:id – modifier un enregistrement de consommation (par exemple si on veut ajuster la valeur ou les dates). Ce n’est pas très courant en pratique (on touche rarement aux historiques mesurés), mais on l'implémente pour compléter le CRUD.
DELETE /:id – supprimer un enregistrement de consommation (par exemple, purge d'historique ou erreur de mesure).
GET /moyenne/:appareilId – route personnalisée pour calculer la consommation moyenne d'un appareil donné sur une période. On s’attend à recevoir la période via les query params (par exemple ?debut=2023-01-01&fin=2023-01-31). Le contrôleur utilisera ces dates pour filtrer les consommations de l'appareil et calculer la moyenne (somme des quantités / nombre d'entrées). Cela correspond à la méthode calculerMoyenne() du diagramme UML.
Maintenant le contrôleur controllers/consommationController.js :
javascript
Copier
Modifier
// controllers/consommationController.js

const Consommation = require('../models/consommationModel');
const Appareil = require('../models/appareilModel');
const Notification = require('../models/notificationModel');

// Créer un nouvel enregistrement de consommation
exports.creerConsommation = async (req, res) => {
  try {
    const { appareil: appareilId, debut, fin, quantite } = req.body;
    if (!appareilId || !debut || !fin || quantite === undefined) {
      return res.status(400).json({ message: "appareil, debut, fin et quantite sont requis." });
    }
    // Vérifier que l'appareil appartient à l'utilisateur connecté
    const appareil = await Appareil.findById(appareilId);
    if (!appareil) {
      return res.status(404).json({ message: "Appareil spécifié introuvable." });
    }
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à enregistrer une consommation pour cet appareil." });
    }
    // Créer l'objet consommation
    const nouvelleConso = new Consommation({
      appareil: appareilId,
      debut: new Date(debut),
      fin: new Date(fin),
      quantite: quantite
    });
    await nouvelleConso.save();
    // Fonctionnalité clé: vérifier si quantite dépasse le seuil de l'appareil, et créer une notification le cas échéant
    if (appareil.seuilConso && quantite > appareil.seuilConso) {
      const contenuNotif = `Consommation élevée: ${quantite} (seuil: ${appareil.seuilConso}) pour l'appareil "${appareil.nom}"`;
      const notif = new Notification({
        utilisateur: req.userId,
        appareil: appareilId,
        contenu: contenuNotif,
        envoyee: false
      });
      await notif.save();
      // (Optionnel) Ici, on pourrait appeler un service d'envoi d'email avec le contenu de la notif
      // ex: EmailService.send(utilisateur.email, "Alerte de consommation", contenuNotif);
    }
    res.status(201).json({ message: "Consommation enregistrée", consommation: nouvelleConso });
  } catch (err) {
    console.error("Erreur création consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors de la création de la consommation." });
  }
};

// Obtenir les consommations (tous appareils de l'utilisateur, ou filtrées par appareil)
exports.getConsommations = async (req, res) => {
  try {
    const appareilFiltre = req.query.appareil;
    let consommations;
    if (appareilFiltre) {
      // Vérifier que l'appareil en question appartient bien au user
      const app = await Appareil.findById(appareilFiltre);
      if (!app || app.utilisateur.toString() !== req.userId) {
        return res.status(403).json({ message: "Accès refusé ou appareil invalide." });
      }
      // Filtrer par cet appareil
      consommations = await Consommation.find({ appareil: appareilFiltre });
    } else {
      // Récupérer tous les appareils de l'utilisateur, puis leurs consommations
      const appareilsUser = await Appareil.find({ utilisateur: req.userId }).select('_id');
      const appareilIds = appareilsUser.map(a => a._id);
      consommations = await Consommation.find({ appareil: { $in: appareilIds } });
    }
    res.status(200).json(consommations);
  } catch (err) {
    console.error("Erreur récupération consommations:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des consommations." });
  }
};

// Obtenir une consommation par son ID
exports.getConsommationParId = async (req, res) => {
  try {
    const consoId = req.params.id;
    const conso = await Consommation.findById(consoId).populate('appareil');
    if (!conso) {
      return res.status(404).json({ message: "Enregistrement de consommation non trouvé." });
    }
    // Vérifier que la consommation appartient à un appareil de l'utilisateur
    if (conso.appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès non autorisé à cette ressource." });
    }
    res.status(200).json(conso);
  } catch (err) {
    console.error("Erreur récupération consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération de la consommation." });
  }
};

// Mettre à jour un enregistrement de consommation
exports.updateConsommation = async (req, res) => {
  try {
    const consoId = req.params.id;
    const conso = await Consommation.findById(consoId).populate('appareil');
    if (!conso) {
      return res.status(404).json({ message: "Consommation non trouvée." });
    }
    // Vérifier propriétaire via l'appareil lié
    if (conso.appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Vous n'avez pas accès à cette consommation." });
    }
    // Mettre à jour les champs
    const { debut, fin, quantite } = req.body;
    if (debut !== undefined) conso.debut = new Date(debut);
    if (fin !== undefined) conso.fin = new Date(fin);
    if (quantite !== undefined) conso.quantite = quantite;
    const consoMAJ = await conso.save();
    res.status(200).json({ message: "Consommation mise à jour", consommation: consoMAJ });
  } catch (err) {
    console.error("Erreur mise à jour consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour de la consommation." });
  }
};

// Supprimer un enregistrement de consommation
exports.supprimerConsommation = async (req, res) => {
  try {
    const consoId = req.params.id;
    // On vérifie d'abord si la consommation existe et appartient bien au user
    const conso = await Consommation.findById(consoId).populate('appareil');
    if (!conso) {
      return res.status(404).json({ message: "Consommation non trouvée." });
    }
    if (conso.appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Vous ne pouvez pas supprimer cette consommation." });
    }
    await Consommation.findByIdAndDelete(consoId);
    res.status(200).json({ message: "Consommation supprimée." });
  } catch (err) {
    console.error("Erreur suppression consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression de la consommation." });
  }
};

// Calculer la consommation moyenne sur une période pour un appareil donné
exports.calculerMoyenneConsommation = async (req, res) => {
  try {
    const appareilId = req.params.appareilId;
    const { debut, fin } = req.query; // on attend des dates en paramètre de requête
    if (!debut || !fin) {
      return res.status(400).json({ message: "Veuillez fournir une date de debut et de fin (paramètres ?debut=...&fin=...)."});
    }
    // Vérifier que l'appareil appartient bien à l'utilisateur
    const appareil = await Appareil.findById(appareilId);
    if (!appareil) {
      return res.status(404).json({ message: "Appareil non trouvé." });
    }
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Cet appareil n'appartient pas à l'utilisateur connecté." });
    }
    const dateDebut = new Date(debut);
    const dateFin = new Date(fin);
    // Récupérer toutes les consommations de cet appareil dans l'intervalle [debut, fin]
    const consommations = await Consommation.find({ 
      appareil: appareilId,
      debut: { $gte: dateDebut },
      fin:   { $lte: dateFin }
    });
    if (consommations.length === 0) {
      return res.status(200).json({ message: "Aucune consommation enregistrée dans cette période.", moyenne: 0 });
    }
    // Calcul de la moyenne
    const total = consommations.reduce((sum, c) => sum + c.quantite, 0);
    const moyenne = total / consommations.length;
    res.status(200).json({ 
      message: `Consommation moyenne de l'appareil ${appareil.nom} du ${debut} au ${fin}`, 
      moyenne: moyenne,
      unite: "kWh",
      nombreEnregistrements: consommations.length
    });
  } catch (err) {
    console.error("Erreur calcul moyenne consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors du calcul de la moyenne." });
  }
};
Explications (contrôleur consommation) :
On importe les modèles Consommation, Appareil, Notification car on interagit avec ces trois.
creerConsommation :
Valide la présence de tous les champs obligatoires (appareilId, debut, fin, quantite). Note: on teste quantite === undefined car quantite = 0 est un cas valide mais falsy, donc on veut accepter 0.
Vérifie que l'appareil mentionné existe et appartient bien à l'utilisateur (mêmes vérifications d'ownership que précédemment).
Crée un nouvel objet Consommation en convertissant bien debut et fin en objets Date (si ce sont des strings ISO ou timestamps).
Sauvegarde la consommation.
Fonctionnalité clé – Notifications de dépassement de seuil : Après avoir enregistré la consommation, on compare la quantite mesurée au seuilConso de l'appareil. Si un seuil est défini (non nul) et que la consommation dépasse ce seuil, on génère une Notification :
On construit un contenu de notification, par exemple "Consommation élevée: X (seuil: Y) pour l'appareil Z" qui informe l'utilisateur du dépassement.
On crée et sauvegarde un objet Notification avec utilisateur = req.userId, appareil = appareilId, le contenu qu’on vient de formater, et envoyee = false (en attente d'envoi).
(Optionnel) On mentionne qu'ici on pourrait appeler un service d'e-mail réel pour envoyer la notification (par ex. via NodeMailer ou un autre module), puis peut-être mettre envoyee = true une fois l'email parti. Pour simplifier, on n'implémente pas l’envoi effectif, on se contente de créer la notification en base.
Renvoie 201 avec la consommation créée.
Remarque: cette partie implémente la méthode mesurerConsommation() (en créant un enregistrement) et illustre envoyerMail() de Notification (via la création d'une notif prête à être envoyée).
getConsommations :
Permet de récupérer les consommations. On regarde si un filtre appareil est présent dans la query (req.query.appareil).
Si un appareilId est fourni en filtre, on vérifie que cet appareil appartient bien à l'utilisateur (sinon 403 ou 404 si non trouvé). Puis on filtre les consommations de cet appareil uniquement.
Si pas de filtre, on récupère tous les appareils de l'utilisateur (find sur Appareil avec utilisateur = req.userId, en ne sélectionnant que les _id), on en extrait les identifiants, puis on récupère toutes les consommations dont le champ appareil est dans ce tableau d'IDs ({ appareil: { $in: appareilIds } }).
Renvoie la liste (tableau) des consommations trouvées.
getConsommationParId :
Récupère un enregistrement de consommation par son ID. On fait populate('appareil') pour avoir directement l'appareil associé (et donc son champ utilisateur pour vérifier l'ownership).
Si non trouvé: 404.
Sinon, check si conso.appareil.utilisateur correspond à req.userId. Si non, 403.
Si autorisé, renvoie la consommation (avec son appareil populé, ce qui peut être pratique pour donner plus d'infos au client).
updateConsommation :
Charge la consommation, populate l'appareil pour vérifier l'utilisateur propriétaire.
Non trouvée -> 404, mauvais propriétaire -> 403.
Met à jour les champs s'ils sont présents dans le body (debut, fin, quantite). On reconvertit en Date pour début/fin.
Sauvegarde la consommation modifiée.
Renvoie succès avec l'objet à jour.
(On pourrait envisager ici aussi de recalculer les notifications si la quantite change et dépasse ou repasse sous le seuil, mais c'est un cas complexe; on n'implémente pas cela pour l'instant).
supprimerConsommation :
Similaire: trouve la consommation, vérifie l'accès.
Supprime via findByIdAndDelete.
Renvoie confirmation.
(Note: on n'a pas besoin de supprimer de notifications liées à cette conso car on n'a pas lié Notification à Consommation directement, seulement à l'appareil et utilisateur).
calculerMoyenneConsommation :
Cette fonction correspond à la méthode calculerMoyenne() du diagramme UML. Elle prend un appareil et une plage de dates et calcule la moyenne des consommations enregistrées.
On récupère appareilId depuis req.params.appareilId et debut, fin depuis req.query. Si les paramètres de dates ne sont pas fournis, on renvoie 400 avec un message d'erreur d'utilisation.
On vérifie que l'appareil existe et appartient bien à l'utilisateur connecté (404/403 le cas échéant).
On convertit les paramètres debut et fin en objets Date.
On récupère toutes les consommations de cet appareil dont debut >= dateDebut et fin <= dateFin. (On suppose ici que chaque enregistrement est une consommation sur un intervalle inclus dans [debut, fin]. Si on voulait être plus complet, il faudrait gérer les chevauchements, mais restons simple).
Si aucune consommation n'est trouvée dans cette période, on peut renvoyer une moyenne de 0 et un message signifiant qu'il n'y a pas de données.
Sinon, on calcule la somme des quantite puis on divise par le nombre d'enregistrements pour avoir la moyenne.
On renvoie 200 avec un message contextualisé (période et nom de l'appareil) et la valeur de la moyenne (éventuellement l'unité kWh pour information, et le nombre d'échantillons).
Cette partie couverture la gestion des consommations et introduit la fonctionnalité clé de notre application : la notification automatique en cas de dépassement de seuil de consommation. C'est un élément central de l'application de suivi d’énergie (alerter l’utilisateur lorsque la consommation d’un appareil sort de la norme qu’il a définie).
Notification – Consultation et envoi des notifications
Enfin, les endpoints Notification permettront à l'utilisateur de consulter les notifications générées (par exemple voir les alertes non lues/envoyées) et potentiellement de marquer une notification comme envoyée ou la supprimer. On peut imaginer que le système enverrait automatiquement les e-mails, mais on propose quand même un endpoint pour déclencher l'envoi d'une notification afin d'illustrer la méthode envoyerMail() du diagramme. Routes routes/notificationRoutes.js :
javascript
Copier
Modifier
// routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifAuth } = require('../middleware/auth');

router.use(verifAuth);

// Obtenir toutes les notifications de l'utilisateur (avec possibilité de filtrer ?envoyee=false par ex.)
router.get('/', notificationController.getNotifications);

// Marquer une notification comme envoyée (simuler l'envoi d'email)
router.put('/:id/envoyer', notificationController.envoyerNotification);

// Supprimer une notification (par ID)
router.delete('/:id', notificationController.supprimerNotification);

module.exports = router;
Explications (routes notification) :
GET / – Récupère toutes les notifications de l'utilisateur connecté. On pourra filtrer par le statut envoyee via une query, par exemple GET /api/notifications?envoyee=false pour ne lister que les notifications en attente d'envoi.
PUT /:id/envoyer – Action pour marquer la notification comme envoyée. En interne, cela pourrait déclencher un envoi email réel. Ici, on le simule en mettant à jour le champ envoyee. Cela correspond à la méthode envoyerMail() du diagramme.
DELETE /:id – Supprimer une notification (par exemple l'utilisateur veut retirer une notification de l'historique). On l'implémente pour le CRUD complet, bien que dans la réalité on pourrait plutôt marquer comme "vue" qu'effacer.
Contrôleur controllers/notificationController.js :
javascript
Copier
Modifier
// controllers/notificationController.js

const Notification = require('../models/notificationModel');
const Utilisateur = require('../models/utilisateurModel');

// Obtenir les notifications de l'utilisateur connecté
exports.getNotifications = async (req, res) => {
  try {
    const filtreEnvoye = req.query.envoyee;
    let criteria = { utilisateur: req.userId };
    if (filtreEnvoye !== undefined) {
      // Si le paramètre envoyee est fourni dans la requête, on filtre sur son booléen
      criteria.envoyee = filtreEnvoye === 'true'; // 'true' (string) -> true (boolean)
    }
    // Récupérer notifications selon les critères (toutes de l'utilisateur, et éventuellement filtrées par statut)
    const notifications = await Notification.find(criteria).populate('appareil');
    res.status(200).json(notifications);
  } catch (err) {
    console.error("Erreur récupération notifications:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des notifications." });
  }
};

// Marquer une notification comme envoyée (et simuler l'envoi de mail)
exports.envoyerNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    // Récupérer la notification et vérifier qu'elle appartient à l'utilisateur
    const notification = await Notification.findById(notificationId).populate('utilisateur').populate('appareil');
    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée." });
    }
    if (notification.utilisateur._id.toString() !== req.userId) {
      return res.status(403).json({ message: "Cette notification n'appartient pas à l'utilisateur." });
    }
    // Simuler l'envoi de l'email de notification:
    // Par exemple, on pourrait utiliser un service email ici. On va simplement marquer envoyee = true.
    notification.envoyee = true;
    await notification.save();
    res.status(200).json({ message: "Notification envoyée (email simulé)", notification });
  } catch (err) {
    console.error("Erreur envoi notification:", err);
    res.status(500).json({ message: "Erreur serveur lors de l'envoi de la notification." });
  }
};

// Supprimer une notification
exports.supprimerNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    // Vérifier que la notification appartient à l'utilisateur
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée." });
    }
    if (notification.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Vous ne pouvez pas supprimer cette notification." });
    }
    await Notification.findByIdAndDelete(notificationId);
    res.status(200).json({ message: "Notification supprimée." });
  } catch (err) {
    console.error("Erreur suppression notification:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression de la notification." });
  }
};
Explications (contrôleur notification) :
getNotifications :
Construit un critère de requête initial pour chercher toutes les notifications de l'utilisateur connecté: { utilisateur: req.userId }.
Si req.query.envoyee est défini, on l’ajoute au critère. Attention, req.query.envoyee est une chaîne ("true" ou "false"). On le compare en string et on assigne le booléen correspondant. Par exemple, si l’URL était /api/notifications?envoyee=false, alors criteria.envoyee = false.
On fait Notification.find(criteria) et on peut populate le champ 'appareil' pour avoir les infos de l'appareil dans la notification (nom de l'appareil notamment pour afficher à l'utilisateur). On pourrait aussi peupler 'utilisateur', mais ce serait l'utilisateur lui-même donc pas très utile ici.
Renvoie le tableau de notifications.
Ainsi, l'utilisateur peut consulter toutes ses notifications. S'il veut seulement celles non envoyées (non lues), il peut appeler GET /api/notifications?envoyee=false.
envoyerNotification :
Récupère une notification par son ID. On populate 'utilisateur' et 'appareil' pour éventuellement disposer de l'email utilisateur ou du nom d'appareil, si on voulait réellement envoyer un email.
Vérifie existence (404) et ownership (403).
Ici, on simule l'envoi de l'email. Dans un système réel, on utiliserait peut-être Utilisateur.findById(notification.utilisateur) pour obtenir l'email de l'utilisateur, puis on utiliserait un module d'envoi de mail (par ex. NodeMailer) pour envoyer notification.contenu à utilisateur.email. Après un envoi réussi, on mettrait notification.envoyee = true.
Dans notre simulation, on se contente de mettre envoyee = true et de sauver la notification, en renvoyant un message "Notification envoyée (email simulé)".
Cela correspond à la méthode UML envoyerMail() – la notification est maintenant marquée comme envoyée, et ne ressortira plus dans les filtres envoyee=false.
supprimerNotification :
Vérifie que la notification existe et appartient bien au user.
La supprime de la base.
Renvoie confirmation.
Ainsi, l'utilisateur peut gérer son historique de notifications (historiqueMails() du diagramme), par exemple supprimer de vieilles alertes.
Avec ces routes, on a un CRUD basique sur les notifications aussi. En pratique, on aurait souvent un système de notifications plus passif (pas forcément exposé autant en API), mais cela répond aux exigences CRUD de l’exercice.
Point d'entrée de l'application et connexion à la base (server.js)
Après avoir défini modèles, middleware, routes et contrôleurs, il nous reste à assembler le tout dans le fichier principal server.js. Ce fichier va :
Configurer la connexion à MongoDB via Mongoose (en utilisant le fichier config/db.js),
Initialiser Express et utiliser les middleware globaux (ex: JSON parsing, éventuellement CORS),
Brancher les routeurs définis ci-dessus sur des URL de base (par ex. /api/utilisateurs),
Lancer le serveur sur un port donné.
Commençons par config/db.js pour la connexion MongoDB (supposons que l'URI de connexion soit fournie dans une variable d'environnement par exemple) :
javascript
Copier
Modifier
// config/db.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Chaîne de connexion à MongoDB - en pratique, à configurer via .env
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mon_app', {
      useNewUrlParser: true,
      useUnifiedTopology: true
      // useFindAndModify et useCreateIndex ne sont plus nécessaires sur les dernières versions de Mongoose
    });
    console.log(`MongoDB connecté : ${conn.connection.host}`);
  } catch (err) {
    console.error("Erreur de connexion à MongoDB :", err);
    process.exit(1); // arrêter le processus en cas d'échec critique de connexion
  }
};

module.exports = connectDB;
Ici, connectDB est une fonction qui tente de se connecter à MongoDB (sur un URI défini). On l'appellera depuis server.js. On utilise mongoose.connect qui retourne une promesse. En cas de succès, on logge l'host de la base connectée, en cas d'échec on logge l'erreur et on exit le process. Enfin, le fichier principal server.js :
javascript
Copier
Modifier
// server.js

const express = require('express');
const connectDB = require('./config/db');

// Import des routeurs
const utilisateurRoutes = require('./routes/utilisateurRoutes');
const appareilRoutes = require('./routes/appareilRoutes');
const consommationRoutes = require('./routes/consommationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connexion à la base de données
connectDB();

// Middleware global
app.use(express.json()); // pour parser automatiquement les requêtes JSON
// (Optionnel: app.use(cors()) si le front-end est hébergé ailleurs et doit accéder à cette API)

// Utilisation des routeurs définis (avec un préfixe d'URL pour chaque groupe)
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/appareils', appareilRoutes);
app.use('/api/consommations', consommationRoutes);
app.use('/api/notifications', notificationRoutes);

// Middleware de gestion des erreurs pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
Explications (server.js) :
On importe Express et notre fonction de connexion DB.
On importe les routeurs de chaque entité (utilisateur, appareil, consommation, notification) que nous avons créés.
On crée l'application Express avec express(). On définit un port (5000 par défaut ici, ou via variable d'environnement).
On appelle connectDB() pour établir la connexion MongoDB avant de traiter les requêtes. (Ceci utilise le module mongoose et connecte à la base configurée).
On ajoute le middleware express.json() pour que le serveur sache décoder les JSON dans le corps des requêtes (toutes nos routes attendent ou renvoient du JSON). On pourrait également activer CORS si nécessaire en important cors (non montré ici mais mentionné en commentaire).
On monte chaque routeur sur une URL de base :
/api/utilisateurs pour tout ce qui concerne les utilisateurs (inscription, login, profil...). Par exemple, le endpoint login complet sera /api/utilisateurs/login.
/api/appareils pour les appareils, ex: /api/appareils/ (POST pour créer, GET pour liste), /api/appareils/:id/on, etc.
/api/consommations pour l'historique de consommation, ex: /api/consommations?appareil=... ou /api/consommations/moyenne/:appareilId.
/api/notifications pour les notifications, ex: /api/notifications?envoyee=false.
Un middleware final attrape les requêtes non gérées par nos routeurs et renvoie une erreur 404 JSON ("Route non trouvée"). Ainsi, si l'utilisateur appelle une route inconnue, il aura un message clair.
On lance l'écoute du serveur sur le port défini, en loggant un message de confirmation sur la console.
Avec cela, le backend Express est opérationnel.
Documentation des endpoints de l'API
Pour terminer, récapitulons les principaux endpoints disponibles dans cette API REST, organisés par ressource, avec leur méthode HTTP et leur fonction : Utilisateurs (/api/utilisateurs/...):
POST /api/utilisateurs/register – Inscription d’un nouvel utilisateur.
Corps JSON: { prenom, nom, email, motDePasse } – crée le compte utilisateur (mot de passe haché) et retourne un token JWT.
POST /api/utilisateurs/login – Connexion de l’utilisateur.
Corps JSON: { email, motDePasse } – vérifie les identifiants, retourne un token JWT si succès.
GET /api/utilisateurs/me – Profil de l’utilisateur connecté (protégé JWT). Retourne les informations de l’utilisateur (hors mot de passe), incluant éventuellement la liste de ses appareils.
PUT /api/utilisateurs/me – Mise à jour du profil (protégé JWT).
Corps JSON: champs à modifier, ex { nom: "Nouveau", motDePasse: "secret" } – met à jour les infos (hachant le mot de passe si fourni).
DELETE /api/utilisateurs/me – Suppression du compte (protégé JWT). Supprime le compte utilisateur authentifié ainsi que ses données liées.
Appareils (/api/appareils/...): (toutes protégées JWT)
POST /api/appareils – Ajout d’un appareil pour l’utilisateur connecté.
Corps JSON: { nom, [seuilConso], [heureDebut], [heureFin] } – crée un appareil (associé à l’utilisateur). On peut optionnellement fixer un seuil de consommation et programmer un mode nuit dès la création.
GET /api/appareils – Liste des appareils de l’utilisateur connecté.
GET /api/appareils/:id – Détails d’un appareil (si appartient à l’utilisateur).
PUT /api/appareils/:id – Mise à jour d’un appareil (nom, seuil, état, ou paramètres du mode nuit).
Corps JSON: peut contenir { nom, seuilConso, etat, modeNuit: { actif, heureDebut, heureFin } }. Met à jour les champs fournis.
DELETE /api/appareils/:id – Suppression d’un appareil (et nettoyage de ses consommations et notifications).
PUT /api/appareils/:id/on – Allumer l’appareil (met son état sur ON).
PUT /api/appareils/:id/off – Éteindre l’appareil (met son état sur OFF).
PUT /api/appareils/:id/mode-nuit/activer – Activer le mode nuit sur l’appareil.
Corps JSON: { heureDebut: "HH:MM", heureFin: "HH:MM" } – enregistre la plage horaire et active le mode nuit (l'appareil sera éteint automatiquement pendant cette plage, dans une implémentation complète).
PUT /api/appareils/:id/mode-nuit/desactiver – Désactiver le mode nuit de l’appareil.
Consommations (/api/consommations/...): (toutes protégées JWT)
POST /api/consommations – Enregistrer une consommation pour un appareil.
Corps JSON: { appareil: <appareilId>, debut: <date>, fin: <date>, quantite: <number> } – ajoute un enregistrement de consommation. Si la quantité dépasse le seuil de l’appareil, une notification est créée automatiquement.
GET /api/consommations – Liste des consommations de l’utilisateur.
Query params: on peut filtrer par appareil avec ?appareil=<appareilId>. Si pas de filtre, retourne toutes les consommations de tous les appareils de l'utilisateur.
GET /api/consommations/:id – Détails d’une consommation donnée (si elle appartient à un appareil de l’utilisateur).
PUT /api/consommations/:id – Mise à jour d’une consommation (dates ou quantité). Par ex, corriger une valeur erronée.
DELETE /api/consommations/:id – Suppression d’une consommation.
GET /api/consommations/moyenne/:appareilId?debut=<date>&fin=<date> – Calcul de la consommation moyenne de l’appareil spécifié sur la période [debut, fin].
Exemple: /api/consommations/moyenne/123abc?debut=2023-01-01&fin=2023-01-31 retourne la consommation moyenne de l’appareil 123abc pour janvier 2023. (Renvoie 0 si aucune donnée.)
Notifications (/api/notifications/...): (toutes protégées JWT)
GET /api/notifications – Liste des notifications de l’utilisateur.
Query params: on peut filtrer par statut d'envoi ?envoyee=false (ou true) pour voir les notifications non encore envoyées (ou déjà envoyées).
PUT /api/notifications/:id/envoyer – Envoyer une notification (marquer comme envoyée). Cela simule l’envoi d’un email au destinataire. Après cet appel, envoyee passe à true pour cette notification.
DELETE /api/notifications/:id – Suppression d’une notification de l’historique.
Chaque endpoint renvoie des données au format JSON et éventuellement un message indiquant le résultat. En cas d’erreur (400, 401, 403, 404 ou 500), un message d’erreur JSON est retourné. Les contrôleurs loggent aussi les erreurs côté serveur (console.error) pour aider au débogage.
Conclusion
Nous avons ainsi généré un backend complet en utilisant Node.js, Express, MongoDB/Mongoose, dans le contexte du stack MERN. Le code est structuré de manière claire selon MVC : Modèles (schémas de données représentant le diagramme UML), Vues (ici ce serait le client React qui n’est pas traité, mais nos réponses JSON font office de vues), et Contrôleurs (logique métier pour chaque route). L'application met en œuvre l’authentification JWT pour sécuriser les ressources utilisateur. Elle gère également une fonctionnalité métier clé : des notifications par email lorsque la consommation d’un appareil dépasse un seuil défini, ainsi qu’un système de mode nuit pour couper des appareils sur des plages horaires. Tout au long du code, nous avons inclus des commentaires explicatifs en français pour éclairer le rôle de chaque section. Les endpoints de l'API sont documentés pour faciliter l’usage depuis un client (par exemple une application React frontend ou des outils comme Postman). Ce backend constitue une base solide que l’on peut adapter selon les besoins : par exemple, intégrer réellement l’envoi d’emails via un service comme NodeMailer ou SendGrid pour les notifications, ou brancher un vrai dispositif IoT pour allumer/éteindre effectivement les appareils. Le code peut également être enrichi avec plus de validations (par ex. format de l’email, robustesse des mots de passe, vérification que debut < fin pour les consommations, etc.), de la pagination pour les listes longues, et la gestion des rôles (admin vs utilisateur standard). Néanmoins, tel quel, il couvre les exigences fonctionnelles à partir du diagramme UML fourni et offre un bon exemple de backend MERN structuré et documenté.