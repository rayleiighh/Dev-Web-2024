// tests/middleware/autoriserAppareils.test.js

//  Hoist these mocks so Jest replaces the real modules
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));

describe('autoriserAppareils middleware', () => {
  let autoriserAppareils, jwt;
  let req, res, next;

  beforeEach(() => {
    // Clear require cache so SECRET_KEY is re‑read inside the middleware
    jest.resetModules();

    // Set the env var before requiring the middleware
    process.env.JWT_SECRET = 'testsecret';

    // Now require the mocked jwt and your middleware
    jwt = require('jsonwebtoken');
    autoriserAppareils = require('../../middleware/autoriserAppareils'); 

    // Reset call history on the mock
    jwt.verify.mockClear();

    // Fake Express req, res, next
    req = { headers: {}, originalUrl: '/test' };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('should return 401 if Authorization header is missing', () => {
    autoriserAppareils(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token requis' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token verification fails', () => {
    req.headers.authorization = 'Bearer badtoken';
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });

    autoriserAppareils(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('badtoken', 'testsecret');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token invalide ou expiré' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if payload has neither id nor deviceId', () => {
    req.headers.authorization = 'Bearer sometoken';
    jwt.verify.mockReturnValue({}); // no id or deviceId

    autoriserAppareils(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('sometoken', 'testsecret');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token sans identifiant valide' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next and set req.userId when payload contains id', () => {
    req.headers.authorization = 'Bearer token123';
    jwt.verify.mockReturnValue({ id: 'user1', deviceId: 'devX' });

    autoriserAppareils(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('token123', 'testsecret');
    expect(req.userId).toBe('user1');
    expect(req.deviceId).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('should call next and set req.deviceId when payload contains deviceId only', () => {
    // allow raw token without "Bearer "
    req.headers.authorization = 'deviceToken';
    jwt.verify.mockReturnValue({ deviceId: 'dev123' });

    autoriserAppareils(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('deviceToken', 'testsecret');
    expect(req.deviceId).toBe('dev123');
    expect(req.userId).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
