jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('../../models/multipriseModel');

describe('verifAuthDevice middleware', () => {
  let verifAuthDevice, jwt, Multiprise;
  let req, res, next;

  beforeEach(() => {
    //  Reset the module registry so SECRET_KEY is re‑read
    jest.resetModules();

    //  Set the env var *before* requiring anything that reads it
    process.env.JWT_SECRET = 'testsecret';

    //  Re‑import the mocks & the middleware
    jwt = require('jsonwebtoken');
    Multiprise = require('../../models/multipriseModel');
    verifAuthDevice = require('../../middleware/authDevice').verifAuthDevice; 

    //  Clear mock call history
    jwt.verify.mockClear();
    Multiprise.findOne.mockClear();

    // Fake req/res/next
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should return 401 if Authorization header is missing', async () => {
    await verifAuthDevice(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token manquant' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if token is invalid', async () => {
    req.headers.authorization = 'Bearer invalidtoken';
    jwt.verify.mockImplementation(() => { throw new Error('bad token'); });

    await verifAuthDevice(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('invalidtoken', 'testsecret');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token device invalide ou expiré' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if payload has no deviceId', async () => {
    req.headers.authorization = 'Bearer token123';
    jwt.verify.mockReturnValue({}); // no deviceId

    await verifAuthDevice(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('token123', 'testsecret');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'deviceId absent du token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 404 if device is not found', async () => {
    req.headers.authorization = 'Bearer token123';
    jwt.verify.mockReturnValue({ deviceId: 'device123' });
    Multiprise.findOne.mockResolvedValue(null);

    await verifAuthDevice(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('token123', 'testsecret');
    expect(Multiprise.findOne).toHaveBeenCalledWith({ identifiantUnique: 'device123' });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Multiprise inconnue' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() and attach device info on success', async () => {
    req.headers.authorization = 'Bearer goodtoken';
    jwt.verify.mockReturnValue({ deviceId: 'device123' });
    const mockMultiprise = { _id: 'multi1', identifiantUnique: 'device123' };
    Multiprise.findOne.mockResolvedValue(mockMultiprise);

    console.log = jest.fn();

    await verifAuthDevice(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('goodtoken', 'testsecret');
    expect(req.deviceId).toBe('device123');
    expect(req.multiprise).toBe(mockMultiprise);
    expect(console.log).toHaveBeenCalledWith(' Auth OK multiprise :', 'device123');
    expect(next).toHaveBeenCalled();
  });
});
