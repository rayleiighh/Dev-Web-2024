afterEach(() => {
  // If any tests used fake timers, clear them & restore real timers
  jest.clearAllTimers();
  jest.useRealTimers();

  // If any tests set global.io, nuke it
  if (global.io) {
    delete global.io;
  }
});
  
  afterAll(() => {
    jest.useRealTimers();
  });
  