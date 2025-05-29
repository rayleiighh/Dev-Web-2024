const nodemailer = require('nodemailer');
const twilio = require('twilio');
require('dotenv').config();

// Configuration de Nodemailer (envoi d'emails)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,  // À mettre dans .env
    pass: process.env.EMAIL_PASS
  },
});




// Fonction pour envoyer un email
const sendEmail = async (to, subject, message) => {
    try {
      console.log(`📧 Tentative d'envoi d'email à : ${to} avec sujet "${subject}"`);
      const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text: message
      });
      console.log(`Email envoyé avec succès : ${info.response}`);
    } catch (error) {
      console.error("Erreur d'envoi d'email:", error.message);
    }
};
  
  

// Configuration Twilio (SMS) - Optionnel
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const sendSMS = async (to, message) => {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    console.log(`📲 SMS envoyé à ${to}`);
  } catch (error) {
    console.error("Erreur d'envoi de SMS:", error);
  }
};
console.log("Tentative d'envoi email avec :", process.env.EMAIL_USER);



module.exports = { sendEmail, sendSMS };
