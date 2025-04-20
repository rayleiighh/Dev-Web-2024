// tests/controllers/notificationController.test.js

// 1️⃣ Mock all external modules before importing the controller
jest.mock('../../models/notificationModel');
jest.mock('../../models/utilisateurModel');
jest.mock('../../services/notificationsService');
jest.mock('../../jobs/generateInfoNotifications');

const Notification = require('../../models/notificationModel');
const Utilisateur = require('../../models/utilisateurModel');
const { sendEmail, sendSMS } = require('../../services/notificationsService');
const generateInfoNotifications = require('../../jobs/generateInfoNotifications');

const {
  creerNotification,
  getNotifications,
  envoyerNotification,
  supprimerNotification,
  genererNotificationInfo
} = require('../../controllers/notificationController');

describe('notificationController', () => {
  describe('createNotification', () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();
      req = {
        userId: 'user123',
        body: { contenu: 'Test message', multiprise: 'mpr-01' }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    });

    it('should return 400 if content or power strip ID is missing', async () => {
      req.body = {};  // missing both fields
      await creerNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Contenu et multiprise requis' });
    });

    it('should create a notification without sending email when emailNotifications is false', async () => {
      const mockNotif = { save: jest.fn(), envoyee: false };
      Notification.create.mockResolvedValue(mockNotif);

      Utilisateur.findById.mockResolvedValue({
        preferences: { emailNotifications: false },
        email: 'u@e.com'
      });

      await creerNotification(req, res);

      expect(Notification.create).toHaveBeenCalledWith({
        contenu: 'Test message',
        utilisateurs: ['user123'],
        multiprise: 'mpr-01'
      });
      expect(sendEmail).not.toHaveBeenCalled();
      expect(mockNotif.save).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockNotif);
    });

    it('should create a notification and send an email when emailNotifications is true', async () => {
      const mockNotif = { save: jest.fn(), envoyee: false };
      Notification.create.mockResolvedValue(mockNotif);

      Utilisateur.findById.mockResolvedValue({
        preferences: { emailNotifications: true },
        email: 'u@e.com'
      });
      sendEmail.mockResolvedValue();

      await creerNotification(req, res);

      expect(sendEmail).toHaveBeenCalledWith(
        'u@e.com',
        'Nouvelle alerte',
        expect.stringContaining('Test message')
      );
      expect(mockNotif.envoyee).toBe(true);
      expect(mockNotif.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockNotif);
    });

    it('should handle database errors during creation', async () => {
      const err = new Error('DB fail');
      Notification.create.mockRejectedValue(err);
      console.error = jest.fn();

      await creerNotification(req, res);

      expect(console.error).toHaveBeenCalledWith('Erreur création notification:', err);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Erreur création notification' });
    });

    it('should catch email‐sending failures without failing the request', async () => {
      const err = new Error('SMTP fail');
      const mockNotif = { save: jest.fn(), envoyee: false };
      Notification.create.mockResolvedValue(mockNotif);

      Utilisateur.findById.mockResolvedValue({
        preferences: { emailNotifications: true },
        email: 'u@e.com'
      });
      sendEmail.mockRejectedValue(err);
      console.error = jest.fn();

      await creerNotification(req, res);

      expect(console.error).toHaveBeenCalledWith('Erreur email:', err);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockNotif);
      // Because email failed, .save() should not be called again
      expect(mockNotif.save).not.toHaveBeenCalled();
    });
  });

  describe('getNotifications', () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();
      req = { userId: 'user123' };
      res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    });

    it('should fetch and return sorted notifications for the user', async () => {
      const mockList = [{ a: 1 }, { a: 2 }];
      Notification.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnValue(mockList)
      });

      await getNotifications(req, res);

      expect(Notification.find).toHaveBeenCalledWith({ utilisateurs: 'user123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockList);
    });

    it('should handle database errors when retrieving notifications', async () => {
      const err = new Error('DB error');
      Notification.find.mockImplementation(() => { throw err; });
      console.error = jest.fn();

      await getNotifications(req, res);

      expect(console.error).toHaveBeenCalledWith('❌ Erreur récupération notifications :', err);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Erreur serveur.' });
    });
  });

  describe('sendNotification', () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();
      req = { params: { id: 'notif123' } };
      res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    });

    it('should return 404 if notification not found', async () => {
      Notification.findById.mockResolvedValue(null);

      await envoyerNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification introuvable.' });
    });

    it('should send emails to all users and mark notification as sent', async () => {
      const mockNotif = { utilisateurs: ['u1','u2'], save: jest.fn() };
      Notification.findById.mockResolvedValue(mockNotif);

      Utilisateur.findById
        .mockResolvedValueOnce({ preferences: { emailNotifications: true }, email: 'a@b' })
        .mockResolvedValueOnce({ preferences: { emailNotifications: true }, email: 'c@d' });

      sendEmail.mockResolvedValue();
      console.log = jest.fn();

      await envoyerNotification(req, res);

      expect(sendEmail).toHaveBeenCalledTimes(2);
      expect(console.log).toHaveBeenCalledWith('✅ Email envoyé à :', 'a@b');
      expect(mockNotif.envoyee).toBe(true);
      expect(mockNotif.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Emails envoyés avec succès.' });
    });

    it('should handle errors when looking up or sending emails', async () => {
      const err = new Error('Oops');
      Notification.findById.mockRejectedValue(err);
      console.error = jest.fn();

      await envoyerNotification(req, res);

      expect(console.error).toHaveBeenCalledWith("❌ Erreur lors de l'envoi des emails :", err);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Erreur lors de l'envoi des notifications." });
    });
  });

  describe('deleteNotification', () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();
      req = { params: { id: 'notif123' }, userId: 'user123' };
      res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    });

    it('should return 404 if notification not found', async () => {
      Notification.findById.mockResolvedValue(null);

      await supprimerNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification introuvable.' });
    });

    it('should return 403 if user is not authorized to delete', async () => {
      Notification.findById.mockResolvedValue({ utilisateurs: ['other'] });

      await supprimerNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Non autorisé à supprimer cette notification.' });
    });

    it('should delete and return 200 when authorized', async () => {
      Notification.findById.mockResolvedValue({ utilisateurs: ['user123'] });
      Notification.findByIdAndDelete.mockResolvedValue();

      await supprimerNotification(req, res);

      expect(Notification.findByIdAndDelete).toHaveBeenCalledWith('notif123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification supprimée.' });
    });

    it('should handle database errors during deletion', async () => {
      const err = new Error('DB fail');
      Notification.findById.mockRejectedValue(err);
      console.error = jest.fn();

      await supprimerNotification(req, res);

      expect(console.error).toHaveBeenCalledWith('❌ Erreur suppression notification :', err);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Erreur serveur.' });
    });
  });

  describe('generateInfoNotifications', () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();
      req = {};
      res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    });

    it('should trigger the job and return 200 on success', async () => {
      generateInfoNotifications.mockResolvedValue();

      await genererNotificationInfo(req, res);

      expect(generateInfoNotifications).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Notifications informatives générées avec succès.'
      });
    });

    it('should handle errors thrown by the job', async () => {
      const err = new Error('Job fail');
      generateInfoNotifications.mockRejectedValue(err);
      console.error = jest.fn();

      await genererNotificationInfo(req, res);

      expect(console.error).toHaveBeenCalledWith('❌ Erreur génération manuelle :', err);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Erreur lors de la génération.' });
    });
  });
});
