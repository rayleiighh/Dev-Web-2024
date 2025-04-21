// tests/controllers/consommationController.test.js

const mongoose = require('mongoose');
const mockNotificationSave = jest.fn();
const mockNotificationCreate = jest.fn();
const mockNotificationConstructor = jest.fn().mockImplementation(() => ({
  save: mockNotificationSave
}));

// static .create()
mockNotificationConstructor.create = mockNotificationCreate;

// full mock
jest.mock('../../models/notificationModel', () => mockNotificationConstructor);

const mockSave = jest.fn().mockResolvedValue({
  _id: new mongoose.Types.ObjectId(),
  value: 12,
  timestamp: new Date()
});
let mockConsommationExec = jest.fn();

jest.mock('../../models/consommationModel', () => {
  const mockInstance = { save: mockSave };
  const mockModel = jest.fn(() => mockInstance);
  mockModel.create = jest.fn().mockResolvedValue(mockInstance);
  mockModel.findOne = jest.fn(() => ({
    sort: jest.fn(() => mockConsommationExec())
  }));
  return mockModel;
});

const now = new Date();
const oldDate = new Date(now.getTime() - 60000);
const recentDate = new Date(now.getTime() - 30000);

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

const {
  creerConsommation,
  creerBatchConsommation,
  getDerniereConsommation
} = require('../../controllers/consommationController');
const Multiprise = require('../../models/multipriseModel');
const Utilisateur = require('../../models/utilisateurModel');
const Appareil = require('../../models/appareilModel');

describe('createConsumption', () => {
  let req, res;
  const fakeId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    req = {
      userId: 'user123',
      body: {
        value: 12,
        gpioIndex: 0,
        identifiantUnique: 'rasp-01'
      }
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    global.io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
    jest.clearAllMocks();
  });

  it('should return 400 if a required field is missing', async () => {
    req.body = { value: 12 }; // missing identifiantUnique
    await creerConsommation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("requis")
    });
  });

  it('should return 404 if power strip not found', async () => {
    Multiprise.findOne.mockResolvedValue(null);
    await creerConsommation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("Multiprise introuvable")
    });
  });

  it('should create a consumption and emit a WebSocket event', async () => {
    const mockM = {
      _id: fakeId,
      utilisateurs: ['user123'],
      nom: 'Ma multiprise',
      identifiantUnique: 'rasp-01'
    };
    Multiprise.findOne.mockResolvedValue(mockM);
    Appareil.findOne.mockResolvedValue({ _id: fakeId });
    Utilisateur.findById.mockResolvedValue({
      email: 'test@example.com',
      preferences: { emailNotifications: true }
    });

    await creerConsommation(req, res);

    expect(mockSave).toHaveBeenCalled();
    expect(global.io.emit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("Consommation enregistrée") })
    );
  });
});

describe('createBatchConsumption', () => {
  let req, res;
  const fakeId = new mongoose.Types.ObjectId();

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
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    global.io = { emit: jest.fn() };
    jest.clearAllMocks();
  });

  it('should return 400 if the measurements list is empty', async () => {
    req.body.measurements = [];
    await creerBatchConsommation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("requise")
    });
  });

  it('should return 404 if power strip not found', async () => {
    Multiprise.findOne.mockResolvedValue(null);
    await creerBatchConsommation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("Multiprise non trouvée")
    });
  });

  it('should create measurements, emit WebSocket events and notifications', async () => {
    const mockM = {
      _id: fakeId,
      utilisateurs: ['user123'],
      nom: 'Ma multiprise',
      identifiantUnique: 'rasp-01'
    };
    Multiprise.findOne.mockResolvedValue(mockM);
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

describe('getLastConsumption', () => {
  const now = new Date('2025-04-20T14:00:00Z');
  const oldDate = new Date(now.getTime() - 60000);
  const recentDate = new Date(now.getTime() - 30000);
  let req, res;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    jest.clearAllMocks();
    mockConsommationExec = jest.fn();

    req = { params: { identifiantUnique: 'rasp-01' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('should return 404 if no consumption is found', async () => {
    mockConsommationExec.mockResolvedValue(null);
    await getDerniereConsommation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Aucune consommation trouvée." });
  });

  it('should return active: false if older than 45 seconds', async () => {
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

  it('should return active: true if recent consumption', async () => {
    mockConsommationExec.mockResolvedValue({
      _id: 'conso456',
      value: 12,
      timestamp: recentDate
    });
    await getDerniereConsommation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      active: true,
      _id: 'conso456',
      value: 12,
      timestamp: recentDate
    });
  });

  it('should handle server errors', async () => {
    const err = new Error("DB ERROR");
    mockConsommationExec.mockRejectedValue(err);
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
