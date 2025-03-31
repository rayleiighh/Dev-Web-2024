const mongoose = require("mongoose");

const multipriseSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    default: "Nouvelle multiprise",
  },
  identifiantUnique: {
    type: String,
    required: true,
    unique: true,
  },
  secret: {
    type: String,
    required: true,
  },
  statut: {
    type: String,
    enum: ["actif", "inactif"],
    default: "actif",
  },
  utilisateurs: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Utilisateur",
  }],
  dateAppairage: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Multiprise", multipriseSchema);
