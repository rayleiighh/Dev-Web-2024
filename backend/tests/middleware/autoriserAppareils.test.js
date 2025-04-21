// tests/middleware/autoriserAppareils.test.js

// 1️⃣ Hoist these mocks so Jest replaces the real modules
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));

describe('autoriserAppareils middleware', () => {
  let autoriserAppareils, jwt;
  let req, res, next;

  beforeEach(() => {
    // 2️⃣ Clear require cache so SECRET_KEY is re‑read inside the middleware
    jest.resetModules();

    // 3️⃣ Set the env var before requiring the middleware
    process.env.JWT_SECRET = 'testsecret';

    // 4️⃣ Now require the mocked jwt and your middleware
    jwt = require('jsonwebtoken');
    autoriserAppareils = require('../../middleware/autoriserAppareils'); // :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}

    // 5️⃣ Reset call history on the mock
    jwt.verify.mockClear();

    // 6️⃣ Fake Express req, res, next
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
