// tests/jobs/generateInfoNotifications.test.js

// Mock every model and the email service
jest.mock('../../models/notificationModel');
jest.mock('../../models/multipriseModel');
jest.mock('../../models/consommationModel');
jest.mock('../../models/utilisateurModel');
jest.mock('../../services/notificationsService', () => ({
  sendEmail: jest.fn()
}));

const generateInfoNotifications = require('../../jobs/generateInfoNotifications');
const Notification = require('../../models/notificationModel');
const Multiprise   = require('../../models/multipriseModel');
const Consommation = require('../../models/consommationModel');
const Utilisateur  = require('../../models/utilisateurModel');
const { sendEmail } = require('../../services/notificationsService');

describe('generateInfoNotifications job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should exit early when no power strips are active', async () => {
    Multiprise.find.mockResolvedValue([]);         // no active multiprises

    await expect(generateInfoNotifications()).resolves.toBeUndefined();

    expect(Multiprise.find).toHaveBeenCalledWith({ statut: 'actif' });
    expect(Consommation.find).not.toHaveBeenCalled();
    expect(Notification.create).not.toHaveBeenCalled();
  });

  it('should skip a multiprise with zero consommations', async () => {
    const m = { _id: 'm1', nom: 'M1', utilisateurs: ['u1'] };
    Multiprise.find.mockResolvedValue([m]);
    Consommation.find.mockResolvedValue([]);       // zero mesures today

    await expect(generateInfoNotifications()).resolves.toBeUndefined();

    expect(Consommation.find).toHaveBeenCalledWith({
      multiprise: m._id,
      timestamp: expect.objectContaining({ $gte: expect.any(Date), $lte: expect.any(Date) })
    });
    expect(Notification.create).not.toHaveBeenCalled();
  });

  it('should create a notification and send emails only to opted‑in users', async () => {
    const m = { _id: 'm1', nom: 'M1', utilisateurs: ['u1','u2'] };
    Multiprise.find.mockResolvedValue([m]);
    // two consommations: values 10 and 20
    Consommation.find.mockResolvedValue([{ value: 10 }, { value: 20 }]);
    Notification.create.mockResolvedValue({});

    // u1 has emailNotifications=false, u2=true
    const u1 = { _id: 'u1', preferences: { emailNotifications: false }, email: 'a@b.com' };
    const u2 = { _id: 'u2', preferences: { emailNotifications: true  }, email: 'b@b.com' };
    Utilisateur.findById.mockImplementation(id =>
      Promise.resolve(id === 'u2' ? u2 : u1)
    );

    await generateInfoNotifications();

    // A notification object must have been created once for multiprise M1
    expect(Notification.create).toHaveBeenCalledWith({
      contenu: expect.stringContaining("Info Conso - M1"),
      multiprise: m._id,
      utilisateurs: m.utilisateurs
    });

    // Email sent only once, to user2
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      'b@b.com',
      'Résumé consommation électrique',
      expect.stringContaining("Info Conso - M1")
    );
  });

  it('should catch and log errors without throwing', async () => {
    const err = new Error('DB is down');
    Multiprise.find.mockRejectedValue(err);
    console.error = jest.fn();

    // The call should resolve (not reject)
    await expect(generateInfoNotifications()).resolves.toBeUndefined();

    // And our catch block should have been hit
    expect(console.error).toHaveBeenCalledWith(
      '❌ Erreur génération notifications infos :',
      err
    );
  });
});
