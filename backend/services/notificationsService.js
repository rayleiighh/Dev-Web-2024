const nodemailer = require('nodemailer');
const twilio = require('twilio');
require('dotenv').config();

// Configuration de Nodemailer (envoi d'emails)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,  // 🔥 À mettre dans .env
    pass: process.env.EMAIL_PASS
  }
});

// Fonction pour envoyer un email
const sendEmail = async (to, subject, message) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: message
    });
    console.log(`📧 Email envoyé à ${to}`);
  } catch (error) {
    console.error("❌ Erreur d'envoi d'email:", error);
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
    console.error("❌ Erreur d'envoi de SMS:", error);
  }
};

module.exports = { sendEmail, sendSMS };
