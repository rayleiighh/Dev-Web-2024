const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = express.Router();

// ✅ Route d'inscription
router.post("/register", async (req, res) => {
    try {
        let { username, email, password } = req.body;

        // Nettoyage des entrées utilisateur
        username = username.trim();
        email = email.trim();
        password = password.trim();

        // Vérification des champs obligatoires
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Tous les champs sont requis." });
        }

        // Vérification du format de l'email
        const emailRegex = /.+\@.+\..+/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Veuillez entrer un email valide." });
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Cet email est déjà utilisé." });
        }

        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Création du nouvel utilisateur
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        // Génération du token JWT pour connexion immédiate
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(201).json({
            message: "Utilisateur créé avec succès",
            user: { id: newUser._id, username, email },
            token
        });

    } catch (error) {
        console.error("❌ Erreur lors de l'inscription:", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

// ✅ Route de connexion
router.post("/login", async (req, res) => {
    try {
        let { email, password } = req.body;

        // Nettoyage des entrées utilisateur
        email = email.trim();
        password = password.trim();

        // Vérification des champs obligatoires
        if (!email || !password) {
            return res.status(400).json({ message: "Tous les champs sont requis." });
        }

        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email });
        if (!user) {
            console.log("❌ Aucun utilisateur trouvé avec cet email !");
            return res.status(401).json({ message: "Identifiants incorrects" });
        }

        console.log("✅ Utilisateur trouvé :", user);

        // Vérification du mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log("🔍 Mot de passe entré :", password);
        console.log("🔍 Mot de passe stocké :", user.password);
        console.log("🛠 Comparaison des mots de passe :", isPasswordValid);

        if (!isPasswordValid) {
            console.log("❌ Mot de passe incorrect pour :", email);
            return res.status(401).json({ message: "Identifiants incorrects" });
        }

        // Génération du token JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({
            message: "Connexion réussie",
            user: { id: user._id, username: user.username, email: user.email },
            token
        });

    } catch (error) {
        console.error("❌ Erreur lors de la connexion:", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

module.exports = router;
