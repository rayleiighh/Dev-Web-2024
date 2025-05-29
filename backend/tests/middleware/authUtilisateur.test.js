// tests/middleware/authUtilisateur.test.js

jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('../../models/utilisateurModel');

describe('verifAuthUtilisateur middleware', () => {
  let verifAuthUtilisateur, jwt, Utilisateur;
  let req, res, next;

  beforeEach(() => {
    // 1) clear the module registry
    jest.resetModules();

    // 2) set SECRET_KEY before loading your middleware
    process.env.JWT_SECRET = 'testsecret';

    // 3) re‑require jwt, the model, and your middleware
    jwt = require('jsonwebtoken');
    Utilisateur = require('../../models/utilisateurModel');
    verifAuthUtilisateur = require('../../middleware/authUtilisateur').verifAuthUtilisateur; 

    // 4) reset mock histories
    jwt.verify.mockClear();
    Utilisateur.findById.mockClear();

    // 5) fake req, res, next
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should return 401 if no token is provided', async () => {
    await verifAuthUtilisateur(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token requis' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if token verification fails', async () => {
    req.headers.authorization = 'Bearer badtoken';
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });

    await verifAuthUtilisateur(req, res, next);

    // now jwt.verify is the same mock that authUtilisateur called
    expect(jwt.verify).toHaveBeenCalledWith('badtoken', 'testsecret');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token invalide ou expiré' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if user is not found', async () => {
    req.headers.authorization = 'Bearer sometoken';
    jwt.verify.mockReturnValue({ id: 'user123' });
    Utilisateur.findById.mockResolvedValue(null);

    await verifAuthUtilisateur(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('sometoken', 'testsecret');
    expect(Utilisateur.findById).toHaveBeenCalledWith('user123');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Utilisateur introuvable' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach user to req and call next() on success', async () => {
    req.headers.authorization = 'Bearer validtoken';
    const userMock = { _id: 'user123', email: 'a@b.com' };
    jwt.verify.mockReturnValue({ id: 'user123' });
    Utilisateur.findById.mockResolvedValue(userMock);
    console.log = jest.fn();

    await verifAuthUtilisateur(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'testsecret');
    expect(req.utilisateur).toBe(userMock);
    expect(req.userId).toBe('user123');
    expect(console.log).toHaveBeenCalledWith('🧑‍💻 Utilisateur authentifié :', 'a@b.com');
    expect(next).toHaveBeenCalled();
  });
});
