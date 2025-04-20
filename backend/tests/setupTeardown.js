afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
    delete global.io;
  });
  
  afterAll(() => {
    jest.useRealTimers();
  });
  