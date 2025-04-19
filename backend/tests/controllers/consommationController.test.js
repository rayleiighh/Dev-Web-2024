const mongoose = require('mongoose');

const mockNotificationSave = jest.fn();
const mockSave = jest.fn().mockResolvedValue({
  _id: new mongoose.Types.ObjectId(),
  value: 12,
  timestamp: new Date()
});
const mockNotificationCreate = jest.fn();

const mockNotificationConstructor = jest.fn().mockImplementation(() => ({
  save: mockNotificationSave
}));

// Mock statique .create()
mockNotificationConstructor.create = mockNotificationCreate;

// Mock complet
jest.mock('../../models/notificationModel', () => mockNotificationConstructor);

// Mock des autres modèles et services
jest.mock('../../models/consommationModel', () => {
  const mongoose = require('mongoose');
  return jest.fn().mockImplementation(() => ({
    save: mockSave,
    _id: new mongoose.Types.ObjectId(),
    value: 12,
    timestamp: new Date()
  }));
});

jest.mock('../../models/multipriseModel');
jest.mock('../../models/utilisateurModel');
jest.mock('../../models/appareilModel');

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true)
  })
}));

jest.mock('../../services/notificationsService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

const { creerConsommation, creerBatchConsommation } = require('../../controllers/consommationController');
const Multiprise = require('../../models/multipriseModel');
const Utilisateur = require('../../models/utilisateurModel');
const Appareil = require('../../models/appareilModel');
const Notification = require('../../models/notificationModel');
const Consommation = require('../../models/consommationModel');
const nodemailer = require('nodemailer');

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
    req.body = { value: 12 }; // identifiantUnique manquant

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

    await creerConsommation(req, res);

    expect(mockSave).toHaveBeenCalled();
    expect(global.io.emit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining("Consommation enregistrée")
    }));
  });
});

describe('creerBatchConsommation', () => {
  let req, res;
  const fakeObjectId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    req = {
      deviceId: 'rasp-01',
      userId: 'user123',
      body: {
        measurements: [
          { value: 11, gpioIndex: 0 },
          { value: 14, gpioIndex: 1 }
        ]
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    global.io = {
      emit: jest.fn()
    };

    jest.clearAllMocks();
  });

  it('retourne 400 si la liste est vide', async () => {
    req.body.measurements = [];

    await creerBatchConsommation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("requise")
    });
  });

  it('retourne 404 si multiprise non trouvée', async () => {
    Multiprise.findOne.mockResolvedValue(null);
  
    await creerBatchConsommation(req, res);
  
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("Multiprise non trouvée")
    });
  });
  
  it('crée les consommations, envoie les WebSocket et notifications', async () => {
    const mockMultiprise = {
      _id: fakeObjectId,
      utilisateurs: ['user123'],
      nom: 'Ma multiprise',
      identifiantUnique: 'rasp-01'
    };

    Multiprise.findOne.mockResolvedValue(mockMultiprise);
    Utilisateur.findById.mockResolvedValue({
      email: 'test@example.com',
      preferences: { emailNotifications: true }
    });

    await creerBatchConsommation(req, res);

    expect(mockSave).toHaveBeenCalledTimes(2);
    expect(global.io.emit).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});