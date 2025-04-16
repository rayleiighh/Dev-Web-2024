//register 
const { register } = require('../../controllers/utilisateurController');
const Utilisateur = require('../../models/utilisateurModel');
const Multiprise = require('../../models/multipriseModel');
const Appareil = require('../../models/appareilModel');
const Consommation = require('../../models/consommationModel');
const Notification = require('../../models/notificationModel');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
//login
const { login } = require('../../controllers/utilisateurController');
const bcrypt = require('bcrypt');
// mettreAJourProfil 
const { mettreAJourProfil } = require('../../controllers/utilisateurController');
// verifierEmail
const { verifierEmail } = require('../../controllers/utilisateurController');
// supprimerMonCompte
const { supprimerMonCompte } = require('../../controllers/utilisateurController');

jest.mock('../../models/utilisateurModel');
jest.mock('../../models/multipriseModel');
jest.mock('../../models/appareilModel');
jest.mock('jsonwebtoken');
jest.mock('nodemailer');
jest.mock('bcrypt');
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

  it("renvoie 401 si l'utilisateur n'existe pas", async () => {
    Utilisateur.findOne.mockResolvedValue(null);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining('incorrect') });
  });

  it("renvoie 403 si l'utilisateur n'est pas vérifié", async () => {
    Utilisateur.findOne.mockResolvedValue({
      email: req.body.email,
      verifie: false
    });

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining('confirmer votre email') });
  });

  it("renvoie 401 si le mot de passe est incorrect", async () => {
    Utilisateur.findOne.mockResolvedValue({
      email: req.body.email,
      motDePasse: 'hashedpassword',
      verifie: true
    });

    bcrypt.compare.mockResolvedValue(false);

    await login(req, res);

    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining('incorrect') });
  });

  it("connecte l'utilisateur si tout est correct", async () => {
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

    expect(jwt.sign).toHaveBeenCalledWith({ id: 'user123' }, expect.any(String), expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      token: 'fake-jwt-token',
      utilisateur: expect.objectContaining({
        email: req.body.email,
        nom: 'TestNom',
        prenom: 'TestPrenom'
      })
    }));
  });
});


describe('mettreAJourProfil', () => {
    let req, res, utilisateurMock, sendMailMock;
  
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
  
      utilisateurMock = {
        _id: 'user123',
        nom: 'Ancien Nom',
        email: 'ancien@email.com',
        prenom: 'Rayane',
        motDePasse: 'hashedOldPass',
        save: jest.fn().mockResolvedValue(true)
      };
  
      Utilisateur.findById.mockResolvedValue(utilisateurMock);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedNewPass');
  
      nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });
  
      jest.clearAllMocks();
    });
  
    it('retourne 404 si utilisateur non trouvé', async () => {
      Utilisateur.findById.mockResolvedValue(null);
  
      await mettreAJourProfil(req, res);
  
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Utilisateur non trouvé." });
    });
  
    it('retourne 400 si ancien mot de passe incorrect', async () => {
      bcrypt.compare.mockResolvedValue(false);
  
      await mettreAJourProfil(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Ancien mot de passe incorrect." });
    });
  
    it('met à jour nom, email et mot de passe et envoie 3 mails', async () => {
      await mettreAJourProfil(req, res);
  
      expect(utilisateurMock.nom).toBe(req.body.nom);
      expect(utilisateurMock.email).toBe(req.body.email);
      expect(utilisateurMock.motDePasse).toBe('hashedNewPass');
      expect(sendMailMock).toHaveBeenCalledTimes(3);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Profil mis à jour avec succès." });
    });
  
    it('ne modifie rien si aucune donnée ne change', async () => {
      req.body = {}; // aucun champ à modifier
  
      await mettreAJourProfil(req, res);
  
      expect(sendMailMock).not.toHaveBeenCalled();
      expect(utilisateurMock.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Profil mis à jour avec succès." });
    });
  });

  describe('verifierEmail', () => {
    let req, res, utilisateurMock, sendMailMock;
  
    beforeEach(() => {
      req = {
        query: {
          token: 'valid-token'
        }
      };
  
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  
      utilisateurMock = {
        _id: 'user123',
        email: 'test@example.com',
        verifie: false,
        prenom: 'Rayane',
        save: jest.fn().mockResolvedValue(true)
      };
  
      jwt.verify.mockImplementation(() => ({ id: 'user123' }));
      Utilisateur.findById.mockResolvedValue(utilisateurMock);
  
      sendMailMock = jest.fn().mockResolvedValue(true);
      nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });
  
      jest.clearAllMocks();
    });
  
    it('retourne 400 si token est manquant', async () => {
      req.query.token = null;
  
      await verifierEmail(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Token manquant" });
    });
  
    it('retourne 500 si le token est invalide', async () => {
      jwt.verify.mockImplementation(() => { throw new Error("token invalide"); });
  
      await verifierEmail(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining("Erreur lors de la vérification") });
    });
  
    it('retourne 404 si utilisateur non trouvé', async () => {
      Utilisateur.findById.mockResolvedValue(null);
  
      await verifierEmail(req, res);
  
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Utilisateur non trouvé" });
    });
  
    it('renvoie 200 si utilisateur est déjà vérifié', async () => {
      utilisateurMock.verifie = true;
  
      await verifierEmail(req, res);
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Ce compte a été vérifié." });
    });
  
    it('valide le compte, envoie le mail et retourne 200', async () => {
      await verifierEmail(req, res);
  
      expect(utilisateurMock.verifie).toBe(true);
      expect(utilisateurMock.save).toHaveBeenCalled();
      expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
        to: utilisateurMock.email,
        subject: expect.stringContaining("Bienvenue")
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining("Compte vérifié") });
    });
  });


  describe('supprimerMonCompte', () => {
    let req, res;
  
    beforeEach(() => {
      req = { userId: 'user123' };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  
      // on s'assure que les méthodes sont bien mockées explicitement
      Appareil.find = jest.fn();
      Consommation.deleteMany = jest.fn();
      Notification.deleteMany = jest.fn();
      Appareil.deleteMany = jest.fn();
      Utilisateur.findByIdAndDelete = jest.fn();
  
      jest.clearAllMocks();
    });
  
    it('supprime tous les éléments liés à l’utilisateur et retourne 200', async () => {
      const mockAppareils = [
        { _id: 'app1' },
        { _id: 'app2' }
      ];
  
      Appareil.find.mockResolvedValue(mockAppareils);
      Consommation.deleteMany.mockResolvedValue({});
      Notification.deleteMany.mockResolvedValue({});
      Appareil.deleteMany.mockResolvedValue({});
      Utilisateur.findByIdAndDelete.mockResolvedValue({});
  
      await supprimerMonCompte(req, res);
  
      expect(Appareil.find).toHaveBeenCalledWith({ utilisateur: req.userId });
      expect(Consommation.deleteMany).toHaveBeenCalledWith({ appareil: { $in: ['app1', 'app2'] } });
      expect(Notification.deleteMany).toHaveBeenCalledWith({ appareil: { $in: ['app1', 'app2'] } });
      expect(Appareil.deleteMany).toHaveBeenCalledWith({ utilisateur: req.userId });
      expect(Utilisateur.findByIdAndDelete).toHaveBeenCalledWith(req.userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining("supprimés avec succès") });
    });
  
    it('retourne 500 en cas d’erreur serveur', async () => {
      Appareil.find.mockRejectedValue(new Error("Erreur DB"));
  
      await supprimerMonCompte(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining("Erreur serveur") });
    });
  });