const mongoose = require('mongoose');
const mockNotificationSave = jest.fn();
const mockNotificationCreate = jest.fn();
const mockNotificationConstructor = jest.fn().mockImplementation(() => ({
  save: mockNotificationSave
}));

// Mock statique .create()
mockNotificationConstructor.create = mockNotificationCreate;

// Mock complet
jest.mock('../../models/notificationModel', () => mockNotificationConstructor);


const mockConsommationFindOneExec = jest.fn();

// Mock pour Consommation
const mockConsommationFindOne = jest.fn();
const mockSave = jest.fn().mockResolvedValue({
  _id: new mongoose.Types.ObjectId(),
  value: 12,
  timestamp: new Date()
});
let mockConsommationExec = jest.fn();

jest.mock('../../models/consommationModel', () => {
  const mockInstance = { save: mockSave };
  const mockModel = jest.fn(() => mockInstance);  // new Consommation()
  mockModel.create = jest.fn().mockResolvedValue(mockInstance);

  // findOne().sort(...) doit retourner **directement** la promesse de mockConsommationExec
  mockModel.findOne = jest.fn(() => ({
    sort: jest.fn(() => 
      // la promesse contrôlée par vos mockResolvedValue/mockRejectedValue
      mockConsommationExec()
    )
  }));

  return mockModel;
});


const now = new Date();
const oldDate = new Date(now.getTime() - 60000); // 60 sec
const recentDate = new Date(now.getTime() - 30000); // 30 sec



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
const { getDerniereConsommation } = require('../../controllers/consommationController');

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
describe('getDerniereConsommation', () => {
  const now = new Date('2025-04-20T14:00:00Z');
  const oldDate = new Date(now.getTime() - 60 * 1000);
  const recentDate = new Date(now.getTime() - 30 * 1000);
  let req, res;

  beforeEach(() => {
    // On fixe l’heure aux tests
    jest.useFakeTimers().setSystemTime(now);
    // On reset tous les mocks (y compris mockConsommationExec)
    jest.clearAllMocks();
    mockConsommationExec = jest.fn();
    
    // On prépare req/res
    req = { params: { identifiantUnique: 'rasp-01' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('retourne 404 si aucune consommation trouvée', async () => {
    mockConsommationExec.mockResolvedValue(null);

    await getDerniereConsommation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Aucune consommation trouvée." });
  });

  it('retourne active: false si >45s', async () => {
    mockConsommationExec.mockResolvedValue({
      _id: 'id1',
      value: 10,
      timestamp: oldDate
    });

    await getDerniereConsommation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      active: false,
      message: "Multiprise éteinte"
    });
  });

  it('retourne active: true si consommation récente', async () => {
    mockConsommationExec.mockResolvedValue({
      _id: "conso456",
      value: 12,
      timestamp: recentDate
    });

    await getDerniereConsommation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      active: true,
      _id: "conso456",
      value: 12,
      timestamp: recentDate
    });
  });

  it('gère une erreur serveur', async () => {
    const err = new Error("DB ERROR");
    mockConsommationExec.mockRejectedValue(err);

    // On spy console.error
    console.error = jest.fn();

    await getDerniereConsommation(req, res);

    expect(console.error).toHaveBeenCalledWith(
      "Erreur récupération dernière consommation:",
      err
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Erreur serveur." });
  });
});

