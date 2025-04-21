// tests/controllers/utilisateurController.test.js

const {
  register,
  login,
  mettreAJourProfil,
  verifierEmail,
  supprimerMonCompte
} = require('../../controllers/utilisateurController');

const Utilisateur = require('../../models/utilisateurModel');
const Multiprise = require('../../models/multipriseModel');
const Appareil = require('../../models/appareilModel');
const Consommation = require('../../models/consommationModel');
const Notification = require('../../models/notificationModel');

const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

jest.mock('../../models/utilisateurModel');
jest.mock('../../models/multipriseModel');
jest.mock('../../models/appareilModel');
jest.mock('../../models/consommationModel');
jest.mock('../../models/notificationModel');
jest.mock('jsonwebtoken');
jest.mock('nodemailer');
jest.mock('bcrypt');

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

  it('should return 400 if a required field is missing', async () => {
    req.body.email = '';

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Tous les champs')
      })
    );
  });

  it('should return 400 if the user already exists', async () => {
    Utilisateur.findOne.mockResolvedValue({ email: req.body.email });

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('existe déjà')
      })
    );
  });

  it('should return 404 if the power strip is not found', async () => {
    Multiprise.findOne.mockResolvedValue(null);

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Aucune multiprise trouvée')
      })
    );
  });

  it('should create a user, link devices, send a verification email and return 200', async () => {
    await register(req, res);

    expect(Utilisateur.mock.calls.length).toBe(1);
    expect(mockSave).toHaveBeenCalled();
    expect(Appareil.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ nom: 'Prise 1', gpioIndex: 0 })
      ])
    );
    expect(jwt.sign).toHaveBeenCalled();
    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('email de vérification')
      })
    );
  });
});

describe('login', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        motDePasse: 'password123'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  it('should return 401 if the user does not exist', async () => {
    Utilisateur.findOne.mockResolvedValue(null);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining('incorrect')
    });
  });

  it('should return 403 if the user is not verified', async () => {
    Utilisateur.findOne.mockResolvedValue({
      email: req.body.email,
      verifie: false
    });

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining('confirmer votre email')
    });
  });

  it('should return 401 if the password is incorrect', async () => {
    Utilisateur.findOne.mockResolvedValue({
      email: req.body.email,
      motDePasse: 'hashedpassword',
      verifie: true
    });
    bcrypt.compare.mockResolvedValue(false);

    await login(req, res);

    expect(bcrypt.compare).toHaveBeenCalledWith(
      'password123',
      'hashedpassword'
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining('incorrect')
    });
  });

  it('should authenticate the user if credentials are correct', async () => {
    Utilisateur.findOne.mockResolvedValue({
      _id: 'user123',
      email: req.body.email,
      motDePasse: 'hashedpassword',
      verifie: true,
      nom: 'TestNom',
      prenom: 'TestPrenom'
    });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('fake-jwt-token');

    await login(req, res);

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'user123' },
      expect.any(String),
      expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'fake-jwt-token',
        utilisateur: expect.objectContaining({
          email: req.body.email,
          nom: 'TestNom',
          prenom: 'TestPrenom'
        })
      })
    );
  });
});

describe('updateProfile', () => {
  let req, res, userMock, sendMailMock;

  beforeEach(() => {
    req = {
      userId: 'user123',
      body: {
        nom: 'Nouveau Nom',
        email: 'nouveau@email.com',
        ancienMotDePasse: 'oldpass',
        nouveauMotDePasse: 'newpass'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    sendMailMock = jest.fn().mockResolvedValue(true);

    userMock = {
      _id: 'user123',
      nom: 'Ancien Nom',
      email: 'ancien@email.com',
      prenom: 'Rayane',
      motDePasse: 'hashedOldPass',
      save: jest.fn().mockResolvedValue(true)
    };

    Utilisateur.findById.mockResolvedValue(userMock);
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hashedNewPass');

    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

    jest.clearAllMocks();
  });

  it('should return 404 if the user is not found', async () => {
    Utilisateur.findById.mockResolvedValue(null);

    await mettreAJourProfil(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Utilisateur non trouvé.'
    });
  });

  it('should return 400 if the old password is incorrect', async () => {
    bcrypt.compare.mockResolvedValue(false);

    await mettreAJourProfil(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ancien mot de passe incorrect.'
    });
  });

  it('should update name, email and password and send three emails', async () => {
    await mettreAJourProfil(req, res);

    expect(userMock.nom).toBe(req.body.nom);
    expect(userMock.email).toBe(req.body.email);
    expect(userMock.motDePasse).toBe('hashedNewPass');
    expect(sendMailMock).toHaveBeenCalledTimes(3);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Profil mis à jour avec succès.'
    });
  });

  it('should do nothing if no fields are changed', async () => {
    req.body = {};

    await mettreAJourProfil(req, res);

    expect(sendMailMock).not.toHaveBeenCalled();
    expect(userMock.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Profil mis à jour avec succès.'
    });
  });
});

describe('verifyEmail', () => {
  let req, res, userMock, sendMailMock;

  beforeEach(() => {
    req = {
      query: { token: 'valid-token' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    userMock = {
      _id: 'user123',
      email: 'test@example.com',
      verifie: false,
      prenom: 'Rayane',
      save: jest.fn().mockResolvedValue(true)
    };

    jwt.verify.mockImplementation(() => ({ id: 'user123' }));
    Utilisateur.findById.mockResolvedValue(userMock);

    sendMailMock = jest.fn().mockResolvedValue(true);
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

    jest.clearAllMocks();
  });

  it('should return 400 if token is missing', async () => {
    req.query.token = null;

    await verifierEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Token manquant'
    });
  });

  it('should return 500 if token is invalid', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('token invalide'); });

    await verifierEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining('Erreur lors de la vérification')
    });
  });

  it('should return 404 if user not found', async () => {
    Utilisateur.findById.mockResolvedValue(null);

    await verifierEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Utilisateur non trouvé'
    });
  });

  it('should return 200 if account is already verified', async () => {
    userMock.verifie = true;

    await verifierEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ce compte a été vérifié.'
    });
  });

  it('should verify the account, send welcome email and return 200', async () => {
    await verifierEmail(req, res);

    expect(userMock.verifie).toBe(true);
    expect(userMock.save).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: userMock.email,
        subject: expect.stringContaining('Bienvenue')
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining('Compte vérifié')
    });
  });
});

describe('deleteMyAccount', () => {
  let req, res;

  beforeEach(() => {
    req = { userId: 'user123' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    Appareil.find = jest.fn();
    Consommation.deleteMany = jest.fn();
    Notification.deleteMany = jest.fn();
    Appareil.deleteMany = jest.fn();
    Utilisateur.findByIdAndDelete = jest.fn();

    jest.clearAllMocks();
  });

  it('should delete all user data and return 200', async () => {
    const mockDevices = [{ _id: 'app1' }, { _id: 'app2' }];

    Appareil.find.mockResolvedValue(mockDevices);
    Consommation.deleteMany.mockResolvedValue({});
    Notification.deleteMany.mockResolvedValue({});
    Appareil.deleteMany.mockResolvedValue({});
    Utilisateur.findByIdAndDelete.mockResolvedValue({});

    await supprimerMonCompte(req, res);

    expect(Appareil.find).toHaveBeenCalledWith({ utilisateur: req.userId });
    expect(Consommation.deleteMany).toHaveBeenCalledWith({
      appareil: { $in: ['app1', 'app2'] }
    });
    expect(Notification.deleteMany).toHaveBeenCalledWith({
      appareil: { $in: ['app1', 'app2'] }
    });
    expect(Appareil.deleteMany).toHaveBeenCalledWith({ utilisateur: req.userId });
    expect(Utilisateur.findByIdAndDelete).toHaveBeenCalledWith(req.userId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining('supprimés avec succès')
    });
  });

  it('should return 500 on server error', async () => {
    Appareil.find.mockRejectedValue(new Error('Erreur DB'));

    await supprimerMonCompte(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining('Erreur serveur')
    });
  });
});
