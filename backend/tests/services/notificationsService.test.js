// tests/services/notificationsService.test.js

// Mock environment loader
jest.mock('dotenv', () => ({ config: jest.fn() }));

// Mock Nodemailer and Twilio modules
jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));
jest.mock('twilio', () => jest.fn());

const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Set required environment variables before loading the service
process.env.EMAIL_USER = 'user@test.com';
process.env.EMAIL_PASS = 'pass';
process.env.TWILIO_SID = 'sid';
process.env.TWILIO_AUTH_TOKEN = 'token';
process.env.TWILIO_PHONE_NUMBER = '+123456789';

// Configure the mocked transporter and client
const sendMailMock = jest.fn();
nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

const messagesCreateMock = jest.fn();
twilio.mockReturnValue({ messages: { create: messagesCreateMock } });

// Spy on console methods
console.log = jest.fn();
console.error = jest.fn();

// Import the service (this will run the module‑level setup code)
const { sendEmail, sendSMS } = require('../../services/notificationsService');  
// :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}

// Clear any calls triggered by the module‑level IIFE
sendMailMock.mockClear();
messagesCreateMock.mockClear();
console.log.mockClear();
console.error.mockClear();

describe('notificationsService', () => {
  it('should configure Nodemailer transporter correctly', () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: {
        user: 'user@test.com',
        pass: 'pass'
      }
    });
  });

  describe('sendEmail', () => {
    beforeEach(() => {
      sendMailMock.mockClear();
      console.log.mockClear();
      console.error.mockClear();
    });

    it('should send an email and log success', async () => {
      // Arrange
      sendMailMock.mockResolvedValue({ response: 'OK' });
      const to = 'recipient@test.com';
      const subject = 'Subject';
      const message = 'Hello';

      // Act
      await sendEmail(to, subject, message);

      // Assert
      expect(sendMailMock).toHaveBeenCalledWith({
        from: 'user@test.com',
        to,
        subject,
        text: message
      });
      expect(console.log).toHaveBeenCalledWith(
        `📧 Tentative d'envoi d'email à : ${to} avec sujet "${subject}"`
      );
      expect(console.log).toHaveBeenCalledWith(
        `✅ Email envoyé avec succès : OK`
      );
    });

    it('should catch errors and log error message', async () => {
      // Arrange
      const error = new Error('fail');
      sendMailMock.mockRejectedValue(error);

      // Act
      await sendEmail('r', 's', 'm');

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        "❌ Erreur d'envoi d'email:",
        'fail'
      );
    });
  });

  describe('sendSMS', () => {
    beforeEach(() => {
      messagesCreateMock.mockClear();
      console.log.mockClear();
      console.error.mockClear();
    });

    it('should send an SMS and log success', async () => {
      // Arrange
      messagesCreateMock.mockResolvedValue({ sid: 'SM123' });
      const to = '+155555';
      const message = 'SMS content';

      // Act
      await sendSMS(to, message);

      // Assert
      expect(twilio).toHaveBeenCalledWith('sid', 'token');
      expect(messagesCreateMock).toHaveBeenCalledWith({
        body: message,
        from: '+123456789',
        to
      });
      expect(console.log).toHaveBeenCalledWith(`📲 SMS envoyé à ${to}`);
    });

    it('should catch errors and log the error object', async () => {
      // Arrange
      const error = new Error('smsfail');
      messagesCreateMock.mockRejectedValue(error);

      // Act
      await sendSMS('+1', 'm');

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        " Erreur d'envoi de SMS:",
        error
      );
    });
  });
});
