const { register } = require('../../../controllers/utilisateurController');
const Utilisateur = require('../../models/utilisateurModel');
const Multiprise = require('../../../models/multipriseModel');
const Appareil = require('../../../models/appareilModel');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

jest.mock('../../models/multipriseModel'); 
jest.mock('../../models/multipriseModel');
jest.mock('../../models/appareilModel');
jest.mock('jsonwebtoken');
jest.mock('nodemailer');

describe('register', () => {
  let req, res, mockSave;

  beforeEach(() => {
    req = {
      body: {
        prenom: 'Rayane',
        nom: 'Test',
        email: 'rayane@test.com',
        motDePasse: 'password123',
        deviceId: 'RASP_TEST_01'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockSave = jest.fn().mockResolvedValue({
      _id: 'user123',
      email: req.body.email,
      prenom: req.body.prenom,
      nom: req.body.nom
    });

    Utilisateur.findOne.mockResolvedValue(null);
    Multiprise.findOne.mockResolvedValue({
      _id: 'multi123',
      identifiantUnique: req.body.deviceId,
      utilisateurs: [],
      save: jest.fn()
    });
    Appareil.countDocuments.mockResolvedValue(0);
    Appareil.insertMany.mockResolvedValue(true);
    jwt.sign.mockReturnValue('fake-jwt-token');

    Utilisateur.mockImplementation(() => ({
      save: mockSave
    }));

    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockResolvedValue(true)
    });

    jest.clearAllMocks();
  });

  it('retourne une erreur si un champ est manquant', async () => {
    req.body.email = '';

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Tous les champs') })
    );
  });

  it('retourne une erreur si un utilisateur existe déjà', async () => {
    Utilisateur.findOne.mockResolvedValue({ email: req.body.email });

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('existe déjà') })
    );
  });

  it('retourne une erreur si la multiprise n\'est pas trouvée', async () => {
    Multiprise.findOne.mockResolvedValue(null);

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Aucune multiprise trouvée') })
    );
  });

  it('crée un utilisateur avec multiprise et prises, envoie un mail et retourne 200', async () => {
    await register(req, res);

    expect(Utilisateur.mock.calls.length).toBe(1); // Constructeur appelé
    expect(mockSave).toHaveBeenCalled();
    expect(Appareil.insertMany).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ nom: 'Prise 1', gpioIndex: 0 })
    ]));
    expect(jwt.sign).toHaveBeenCalled();
    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('email de vérification') })
    );
  });
});
