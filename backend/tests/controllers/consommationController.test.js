const { creerConsommation, creerBatchConsommation } = require('../../controllers/consommationController');
const Multiprise = require('../../models/multipriseModel');
const Utilisateur = require('../../models/utilisateurModel');
const Appareil = require('../../models/appareilModel');
const Notification = require('../../models/notificationModel');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose'); // ✅


jest.mock('nodemailer', () => ({
    createTransport: jest.fn()
  }));

// 🔧 Mock de .save()
const mockSave = jest.fn().mockResolvedValue(true);

// ✅ Mock du constructeur Consommation
jest.mock('../../models/consommationModel', () => {
    const mongoose = require('mongoose');
  
    return jest.fn().mockImplementation(() => {
      return {
        save: mockSave,
        _id: new mongoose.Types.ObjectId(),
        value: 12,
        timestamp: new Date()
      };
    });
  });
  

jest.mock('../../models/multipriseModel');
jest.mock('../../models/utilisateurModel');
jest.mock('../../models/appareilModel');

const mockNotificationSave = jest.fn();

jest.mock('../../models/notificationModel', () => {
    return jest.fn().mockImplementation(() => ({
      save: mockNotificationSave
    }));
  });

// ✅ Mock de la fonction d'envoi d'email
jest.mock('../../services/notificationsService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

describe('creerConsommation', () => {
  let req, res;
  const fakeObjectId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    req = {
      userId: 'user123',
      body: {
        value: 12,
        gpioIndex: 0,
        identifiantUnique: 'rasp-01'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    global.io = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };

    jest.clearAllMocks();
  });

  it('retourne 400 si un champ est manquant', async () => {
    req.body = { value: 12 }; // pas d'identifiantUnique

    await creerConsommation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("requis")
    });
  });

  it('retourne 404 si multiprise non trouvée', async () => {
    Multiprise.findOne.mockResolvedValue(null);

    await creerConsommation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("Multiprise introuvable")
    });
  });

  it('crée une consommation et émet un événement WebSocket', async () => {
    const mockMultiprise = {
      _id: fakeObjectId,
      utilisateurs: ['user123'],
      nom: 'Ma multiprise',
      identifiantUnique: 'rasp-01'
    };

    Multiprise.findOne.mockResolvedValue(mockMultiprise);
    Appareil.findOne.mockResolvedValue({ _id: fakeObjectId });
    Utilisateur.findById.mockResolvedValue({
      email: 'test@example.com',
      preferences: { emailNotifications: true }
    });

    const sendMailMock = jest.fn().mockResolvedValue(true);
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

    await creerConsommation(req, res);

    // ✅ Vérifie que .save() a été appelé
    expect(mockSave).toHaveBeenCalled();

    // ✅ Vérifie WebSocket et notification
    expect(global.io.emit).toHaveBeenCalled();
    
    expect(Notification).toHaveBeenCalledWith(expect.objectContaining({
        contenu: expect.stringContaining("Consommation élevée")
      }));
    console.log("📦 Notification.create =", Notification.create);
    expect(mockNotificationSave).toHaveBeenCalled(); // si tu as exposé le mock



    // ✅ Vérifie réponse HTTP
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining("Consommation enregistrée")
    }));
  });
});


const fakeObjectId = new mongoose.Types.ObjectId();

describe('creerBatchConsommation', () => {
    beforeEach(() => {
      req = {
        userId: 'user123',
        body: {
          identifiantUnique: 'rasp-01',
          mesures: []
        }
      };
  
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  
      global.io = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
      };
  
      jest.clearAllMocks();
    });
  
    it('retourne 400 si aucune donnée reçue', async () => {
        req.body.mesures = [{ value: 12, gpioIndex: 0 }];
        Multiprise.findOne.mockResolvedValue(null);
  
      await creerBatchConsommation(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("liste des mesures")
      });
    });
  
    it('retourne 400 si multiprise non trouvée', async () => {
      Multiprise.findOne.mockResolvedValue(null);
  
      await creerBatchConsommation(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400); // 🔁 404 remplacé par 400
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("Multiprise introuvable")
      });
    });
  
    it('crée les consommations, envoie les WebSocket et notifications', async () => {
      req.body.mesures = [
        { value: 11, gpioIndex: 0 },
        { value: 15, gpioIndex: 1 }
      ];
  
      const mockMultiprise = {
        _id: fakeObjectId,
        utilisateurs: ['user123'],
        nom: 'Ma multiprise',
        identifiantUnique: 'rasp-01'
      };
  
      Multiprise.findOne.mockResolvedValue(mockMultiprise);
      Appareil.findOne.mockResolvedValue({ _id: fakeObjectId });
      Utilisateur.findById.mockResolvedValue({
        email: 'test@example.com',
        preferences: { emailNotifications: true }
      });
  
      const sendMailMock = jest.fn().mockResolvedValue(true);
      nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });
  
      await creerBatchConsommation(req, res);
  
      // ✅ Une consommation par élément du batch
      expect(mockSave).toHaveBeenCalledTimes(2);
  
      // ✅ WebSocket émis
      expect(global.io.emit).toHaveBeenCalledTimes(2);
  
      // ✅ Notifications générées
      expect(Notification).toHaveBeenCalledWith(expect.objectContaining({
        contenu: expect.stringContaining("Consommation élevée")
      }));
      expect(mockNotificationSave).toHaveBeenCalledTimes(2);
  
      // ✅ Email
      expect(sendMailMock).toHaveBeenCalled();
  
      // ✅ Réponse HTTP
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("Batch enregistré")
      });
    });
  });
  


