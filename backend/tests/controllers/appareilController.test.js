const { updateAppareilEtat } = require('../../controllers/appareilController');
const { createAppareil } = require('../../controllers/appareilController');
const { updateModeNuit } = require('../../controllers/appareilController');

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

    // mock WebSocket émetteur
    global.io = {
      emit: jest.fn()
    };

    Multiprise.find = jest.fn();
    Appareil.findOneAndUpdate = jest.fn();

    jest.clearAllMocks();
  });

  it('met à jour l’état de l’appareil et émet un événement', async () => {
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

    expect(res.status).not.toHaveBeenCalled(); // res.json direct
    expect(res.json).toHaveBeenCalledWith(mockAppareil);
  });

  it('retourne 404 si aucun appareil trouvé', async () => {
    Multiprise.find.mockResolvedValue([{ _id: 'multi1' }]);
    Appareil.findOneAndUpdate.mockResolvedValue(null);

    await updateAppareilEtat(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining("introuvable") });
  });

  it('retourne 500 en cas d’erreur serveur', async () => {
    Multiprise.find.mockRejectedValue(new Error("Erreur DB"));

    await updateAppareilEtat(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining("mise à jour de l'état") });
  });
});

describe('createAppareil', () => {
    let req, res, saveSpy, nouvelAppareilMock;
  
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
      nouvelAppareilMock = {
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
  
    it('retourne 400 si aucune multiprise liée', async () => {
      Multiprise.find.mockResolvedValue([]);
  
      await createAppareil(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("Aucune multiprise liée")
      });
    });
  
    it('retourne 403 si la limite de 4 appareils est atteinte', async () => {
      Multiprise.find.mockResolvedValue([{ _id: 'multi1' }]);
      Appareil.countDocuments.mockResolvedValue(4);
  
      await createAppareil(req, res);
  
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("Limite atteinte")
      });
    });
  
    it('crée un appareil avec succès', async () => {
      Multiprise.find.mockResolvedValue([{ _id: 'multi1' }]);
      Appareil.countDocuments.mockResolvedValue(2);
  
      // 🛠️ Mock du constructeur Appareil (important !)
      const AppareilConstructor = jest.fn(() => nouvelAppareilMock);
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
        appareil: nouvelAppareilMock
      });
    });
  
    it("retourne 500 en cas d'erreur serveur", async () => {
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
  
    it('retourne 404 si aucun appareil trouvé', async () => {
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
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining("introuvable") });
    });
  
    it('met à jour le mode nuit avec succès', async () => {
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
  
    it('retourne 500 si erreur serveur', async () => {
      Multiprise.find.mockRejectedValue(new Error('MongoDB erreur'));
  
      await updateModeNuit(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Erreur serveur lors de la mise à jour du mode nuit."
      });
    });
  });
  
