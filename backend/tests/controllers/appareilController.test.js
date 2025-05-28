// tests/controllers/appareilController.test.js

const {
  updateAppareilEtat,
  createAppareil,
  updateModeNuit
} = require('../../controllers/appareilController');

const Appareil = require('../../models/appareilModel');
const Multiprise = require('../../models/multipriseModel');

jest.mock('../../models/appareilModel');
jest.mock('../../models/multipriseModel');

describe('updateAppareilEtat', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: 'appareil123' },
      body: { etat: true },
      userId: 'user123'
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // mock WebSocket emitter
    global.io = {
      emit: jest.fn()
    };

    Multiprise.find = jest.fn();
    Appareil.findOneAndUpdate = jest.fn();

    jest.clearAllMocks();
  });

  it('should update the device state and emit an event', async () => {
    const mockMultiprises = [{ _id: 'multi1' }];
    const mockAppareil = {
      _id: 'appareil123',
      gpioIndex: 0,
      etat: true,
      nom: 'Prise 1'
    };

    Multiprise.find.mockResolvedValue(mockMultiprises);
    Appareil.findOneAndUpdate.mockResolvedValue(mockAppareil);

    await updateAppareilEtat(req, res);

    expect(Multiprise.find).toHaveBeenCalledWith({ utilisateurs: 'user123' });
    expect(Appareil.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'appareil123', multiprise: { $in: ['multi1'] } },
      { etat: true },
      { new: true }
    );

    expect(global.io.emit).toHaveBeenCalledWith('etat_prise_changee', {
      id: 'appareil123',
      gpioIndex: 0,
      etat: true
    });

    
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockAppareil);
  });

  it('should return 404 if no device is found', async () => {
    Multiprise.find.mockResolvedValue([{ _id: 'multi1' }]);
    Appareil.findOneAndUpdate.mockResolvedValue(null);

    await updateAppareilEtat(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("introuvable")
    });
  });

  it('should return 500 on server error', async () => {
    Multiprise.find.mockRejectedValue(new Error("Erreur DB"));

    await updateAppareilEtat(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("mise à jour de l'état")
    });
  });
});

describe('createAppareil', () => {
  let req, res, saveSpy, newDeviceMock;

  beforeEach(() => {
    req = {
      userId: 'user123',
      body: {
        nom: 'Nouveau Appareil',
        gpioIndex: 2
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    saveSpy = jest.fn().mockResolvedValue(true);
    newDeviceMock = {
      _id: 'appX',
      nom: 'Nouveau Appareil',
      gpioIndex: 2,
      multiprise: 'multi1',
      save: saveSpy
    };

    Multiprise.find = jest.fn();
    Appareil.countDocuments = jest.fn();

    jest.clearAllMocks();
  });

  it('should return 400 if no power strip is linked', async () => {
    Multiprise.find.mockResolvedValue([]);

    await createAppareil(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("Aucune multiprise liée")
    });
  });

  it('should return 403 if the device limit of 4 is reached', async () => {
    Multiprise.find.mockResolvedValue([{ _id: 'multi1' }]);
    Appareil.countDocuments.mockResolvedValue(4);

    await createAppareil(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("Limite atteinte")
    });
  });

  it('should successfully create a device', async () => {
    Multiprise.find.mockResolvedValue([{ _id: 'multi1' }]);
    Appareil.countDocuments.mockResolvedValue(2);

    // Mock the Appareil constructor
    const AppareilConstructor = jest.fn(() => newDeviceMock);
    Appareil.mockImplementation(AppareilConstructor);

    await createAppareil(req, res);

    expect(AppareilConstructor).toHaveBeenCalledWith({
      nom: req.body.nom,
      gpioIndex: req.body.gpioIndex,
      multiprise: 'multi1'
    });

    expect(saveSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("ajouté"),
      appareil: newDeviceMock
    });
  });

  it('should return 500 on server error', async () => {
    Multiprise.find.mockRejectedValue(new Error("DB Error"));

    await createAppareil(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("Erreur serveur")
    });
  });
});

describe('updateModeNuit', () => {
  let req, res;

  beforeEach(() => {
    req = {
      userId: 'user123',
      params: { id: 'appareil123' },
      body: {
        actif: true,
        heureDebut: '22:00',
        heureFin: '06:00'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    Multiprise.find = jest.fn();
    Appareil.findOneAndUpdate = jest.fn();

    jest.clearAllMocks();
  });

  it('should return 404 if no device is found', async () => {
    Multiprise.find.mockResolvedValue([{ _id: 'multi1' }]);
    Appareil.findOneAndUpdate.mockResolvedValue(null);

    await updateModeNuit(req, res);

    expect(Appareil.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'appareil123', multiprise: { $in: ['multi1'] } },
      {
        modeNuit: {
          actif: true,
          heureDebut: '22:00',
          heureFin: '06:00'
        }
      },
      { new: true }
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("introuvable")
    });
  });

  it('should successfully update night mode', async () => {
    Multiprise.find.mockResolvedValue([{ _id: 'multi1' }]);

    const appareilMock = {
      _id: 'appareil123',
      modeNuit: {
        actif: true,
        heureDebut: '22:00',
        heureFin: '06:00'
      }
    };

    Appareil.findOneAndUpdate.mockResolvedValue(appareilMock);

    await updateModeNuit(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Mode nuit mis à jour",
      appareil: appareilMock
    });
  });

  it('should return 500 on server error', async () => {
    Multiprise.find.mockRejectedValue(new Error('MongoDB erreur'));

    await updateModeNuit(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Erreur serveur lors de la mise à jour du mode nuit."
    });
  });
});
