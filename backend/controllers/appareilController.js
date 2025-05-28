const Appareil = require('../models/appareilModel');
const Multiprise = require('../models/multipriseModel');

//  GET Appareils (Utilisateur ou Multiprise)
exports.getAppareils = async (req, res) => {
  try {
    let appareils = [];

    if (req.userId) {
      const multiprises = await Multiprise.find({ utilisateurs: req.userId });
      const idsMultiprises = multiprises.map(m => m._id);
      appareils = await Appareil.find({ multiprise: { $in: idsMultiprises } });
    } else if (req.deviceId) {
      const multiprise = await Multiprise.findOne({ identifiantUnique: req.deviceId });
      if (!multiprise) return res.status(404).json({ message: "Multiprise non trouvée" });
      appareils = await Appareil.find({ multiprise: multiprise._id });
    } else {
      return res.status(401).json({ message: "Aucun identifiant dans le token" });
    }

    res.json(appareils);
  } catch (err) {
    console.error(" Erreur getAppareils :", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

//   Changer état d’un appareil
exports.updateAppareilEtat = async (req, res) => {
  try {
    const { id } = req.params;
    const { etat } = req.body;

    const multiprises = await Multiprise.find({ utilisateurs: req.userId });
    const idsMultiprises = multiprises.map(m => m._id);

    const appareil = await Appareil.findOneAndUpdate(
      { _id: id, multiprise: { $in: idsMultiprises } },
      { etat },
      { new: true }
    );

    if (!appareil) {
      return res.status(404).json({ message: "Appareil introuvable." });
    }

    global.io.emit("etat_prise_changee", {
      id: appareil._id,
      gpioIndex: appareil.gpioIndex,
      etat: appareil.etat
    });

    console.log(` Prise ${appareil.nom} (GPIO ${appareil.gpioIndex}) changée → ${appareil.etat ? "ON" : "OFF"}`);
    res.json(appareil);
  } catch (error) {
    console.error("❌ Erreur updateAppareilEtat :", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'état de l'appareil." });
  }
};

//   Initialiser les 4 prises
exports.initPrises = async (req, res) => {
  try {
    const multiprises = await Multiprise.find({ utilisateurs: req.userId });
    if (!multiprises.length) return res.status(400).json({ message: "Aucune multiprise liée à ce compte." });

    const multipriseId = multiprises[0]._id;

    await Appareil.deleteMany({ multiprise: multipriseId });

    const prises = [
      { nom: "Prise 1", gpioIndex: 0, multiprise: multipriseId },
      { nom: "Prise 2", gpioIndex: 1, multiprise: multipriseId },
      { nom: "Prise 3", gpioIndex: 2, multiprise: multipriseId }
    ];

    await Appareil.insertMany(prises);
    res.status(201).json({ message: "✅ 4 prises créées avec succès." });
  } catch (error) {
    console.error("❌ Erreur initPrises :", error);
    res.status(500).json({ message: "Erreur serveur lors de la création des prises." });
  }
};

//   Créer un appareil
exports.createAppareil = async (req, res) => {
  try {
    const multiprises = await Multiprise.find({ utilisateurs: req.userId });
    if (!multiprises.length) return res.status(400).json({ message: "Aucune multiprise liée." });

    const multipriseId = multiprises[0]._id;

    const total = await Appareil.countDocuments({ multiprise: multipriseId });
    if (total >= 4) {
      return res.status(403).json({ message: "❌ Limite atteinte : vous ne pouvez avoir que 4 appareils." });
    }

    const { nom, gpioIndex } = req.body;
    const nouvelAppareil = new Appareil({ nom, gpioIndex, multiprise: multipriseId });
    await nouvelAppareil.save();

    res.status(201).json({ message: "✅ Appareil ajouté avec succès", appareil: nouvelAppareil });
  } catch (error) {
    console.error("❌ Erreur createAppareil :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

//   Activer / désactiver le mode nuit
exports.updateModeNuit = async (req, res) => {
  try {
    const { id } = req.params;
    const { actif, heureDebut, heureFin } = req.body;

    console.log(" Mise à jour mode nuit de l'appareil ID :", id);
    console.log(" Payload reçu :", req.body);
    console.log(" Utilisateur ID :", req.userId);

    const multiprises = await Multiprise.find({ utilisateurs: req.userId });
    const idsMultiprises = multiprises.map(m => m._id);

    const appareil = await Appareil.findOneAndUpdate(
      { _id: id, multiprise: { $in: idsMultiprises } },
      {
        modeNuit: {
          actif,
          heureDebut,
          heureFin
        }
      },
      { new: true }
    );

    if (!appareil) {
      return res.status(404).json({ message: "Appareil introuvable." });
    }

    res.status(200).json({ message: "Mode nuit mis à jour", appareil });

  } catch (error) {
    console.error("❌ Erreur updateModeNuit :", error);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour du mode nuit." });
  }
};

exports.updateNomAppareil = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom } = req.body;

    if (!nom) {
      return res.status(400).json({ message: "Le nouveau nom est requis." });
    }

    const multiprises = await Multiprise.find({ utilisateurs: req.userId });
    const idsMultiprises = multiprises.map(m => m._id);

    const appareil = await Appareil.findOneAndUpdate(
      { _id: id, multiprise: { $in: idsMultiprises } },
      { nom },
      { new: true }
    );

    if (!appareil) {
      return res.status(404).json({ message: "Appareil introuvable." });
    }

    res.status(200).json({ message: "Nom mis à jour avec succès", appareil });
  } catch (err) {
    console.error("❌ Erreur updateNomAppareil :", err);
    res.status(500).json({ message: "Erreur serveur lors du renommage." });
  }
};


async function ajouterFavoriSiManquant() {
  const result = await Appareil.updateMany(
    { favori: { $exists: false } },
    { $set: { favori: false } }
  );
  console.log(` Favoris ajoutés à ${result.modifiedCount} appareils`);
}
ajouterFavoriSiManquant();

exports.toggleFavori = async (req, res) => {
  try {
    const { favori } = req.body;
    const updated = await Appareil.findByIdAndUpdate(
      req.params.id,
      { favori },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error("❌ Erreur backend :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

