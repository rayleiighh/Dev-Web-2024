const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

router.post('/', async (req, res) => {
  const { nom, email, message } = req.body;

  if (!nom || !email || !message) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
        from: `"${nom}" <${email}>`,
        to: 'powertrack5000@gmail.com',
        subject: `Nouveau message de ${nom}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, sans-serif; background: #ecf0f3; padding: 30px;">
            <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              
              <!-- En-tête -->
              <div style="background: #3498db; color: white; padding: 20px 30px;">
                <h2 style="margin: 0; font-size: 24px;">
                  Message reçu via PowerTrack
                </h2>
              </div>
      
              <!-- Contenu -->
              <div style="padding: 30px;">
                <p style="margin: 0 0 10px;"><strong style="color: #555;">Nom :</strong> ${nom}</p>
                <p style="margin: 0 0 20px;"><strong style="color: #555;">Email :</strong> 
                  <a href="mailto:${email}" style="color: #3498db;">${email}</a>
                </p>
      
                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
      
                <p style="margin: 0 0 10px;"><strong style="color: #555;">Message :</strong></p>
                <div style="background: #f7f9fb; border-left: 4px solid #3498db; padding: 15px 20px; border-radius: 8px; color: #333; font-size: 15px; line-height: 1.5;">
                  ${message}
                </div>
              </div>
      
              <!-- Pied -->
              <div style="background: #f2f2f2; padding: 15px 30px; text-align: center; font-size: 13px; color: #888;">
                Ce message a été envoyé automatiquement depuis le formulaire de contact PowerTrack.
              </div>
            </div>
          </div>
        `
      });
      
      

    res.status(200).json({ message: "📨 Message envoyé avec succès !" });

  } catch (err) {
    console.error("Erreur d’envoi :", err);
    res.status(500).json({ message: "Erreur lors de l'envoi du message." });
  }
});

module.exports = router;
