const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Définition du schéma utilisateur
const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: [true, "Le nom d'utilisateur est requis"], 
        minlength: [3, "Le nom doit contenir au moins 3 caractères"],
        trim: true
    },
    email: { 
        type: String, 
        required: [true, "L'email est requis"], 
        unique: true, 
        match: [/.+\@.+\..+/, "Veuillez entrer un email valide"],
        trim: true
    },
    password: { 
        type: String, 
        required: [true, "Le mot de passe est requis"], 
        minlength: [6, "Le mot de passe doit contenir au moins 6 caractères"]
    }
}, { timestamps: true }); // Ajoute automatiquement createdAt et updatedAt

// Middleware : hacher le mot de passe avant de sauvegarder
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next(); // Ne hache que si le mot de passe est modifié
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        return next(error);
    }
});

// Méthode pour comparer le mot de passe
userSchema.methods.comparePassword = async function(enteredPassword) {
    try {
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        throw new Error("Erreur lors de la comparaison des mots de passe");
    }
};

module.exports = mongoose.model("User", userSchema);
