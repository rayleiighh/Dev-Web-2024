// tests/config/db.test.js
const mongoose = require('mongoose');

// mock out mongoose.connect
jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

// now require your DB module
const connectDB = require('../../config/db');

describe('config/db', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    mongoose.connect.mockClear();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should call mongoose.connect with the right URI and options', async () => {
    // arrange
    process.env.MONGO_URI = 'mongodb://localhost:27017/mydb';
    mongoose.connect.mockResolvedValueOnce();

    // spy on console.log
    console.log = jest.fn();

    // act
    await connectDB();

    // assert
    expect(mongoose.connect).toHaveBeenCalledWith(
      'mongodb://localhost:27017/mydb',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    expect(console.log).toHaveBeenCalledWith('✅ MongoDB connecté !');
  });

  it('should log an error and exit the process on failure', async () => {
    // arrange
    const error = new Error('connection failed');
    mongoose.connect.mockRejectedValueOnce(error);
    console.error = jest.fn();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    // act
    await connectDB();

    // assert
    expect(console.error).toHaveBeenCalledWith('❌ Erreur connexion MongoDB :', error);
    expect(exitSpy).toHaveBeenCalledWith(1);

    // cleanup
    exitSpy.mockRestore();
  });
});
