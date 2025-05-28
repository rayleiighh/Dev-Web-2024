jest.mock('multer', () => {
    const storageEngine = {};                // dummy storage engine
    const diskStorage = jest.fn(() => storageEngine);
    const multerFn = jest.fn();
    multerFn.diskStorage = diskStorage;
    return multerFn;
  });
  
  const path = require('path');
  
  describe('upload middleware', () => {
    let multer, upload, storageConfig;
  
    beforeEach(() => {
      //  Reset module cache so our mock is re‑applied fresh
      jest.resetModules();
  
      //  Re‑require the mock after reset
      multer = require('multer');
  
      //  Clear any leftover calls
      multer.diskStorage.mockClear();
      multer.mockClear();
  
      //  Require your middleware, which will now call the mock
      upload = require('../../middleware/upload');  // :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}
  
      // Capture the config passed into diskStorage()
      expect(multer.diskStorage).toHaveBeenCalledTimes(1);
      // storageConfig is the config passed into diskStorage
    [storageConfig] = multer.diskStorage.mock.calls[0];
        // storageEngine is what diskStorage returned
        storageEngine = multer.diskStorage.mock.results[0].value;
    });
  
    it('should configure diskStorage destination correctly', () => {
      const cb = jest.fn();
      storageConfig.destination({}, {}, cb);
      expect(cb).toHaveBeenCalledWith(null, 'uploads/profiles');
    });
  
    it('should configure diskStorage filename correctly', () => {
      // Freeze Date.now
      const realNow = Date.now;
      Date.now = () => 987654321;
  
      const cb = jest.fn();
      storageConfig.filename({}, { originalname: 'photo.jpeg' }, cb);
      expect(cb).toHaveBeenCalledWith(null, '987654321.jpeg');
  
      // Restore Date.now
      Date.now = realNow;
    });
  
    it('should create multer with the storage engine', () => {
      // multer() is called with the engine returned by diskStorage
      expect(multer).toHaveBeenCalledWith({ storage: storageEngine });
      // And your module export is whatever our mock multer() returned
      expect(upload).toBe(multer.mock.results[0].value);
    });
  });
  