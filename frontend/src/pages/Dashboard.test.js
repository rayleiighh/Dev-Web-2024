import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import { BrowserRouter } from 'react-router-dom';

// Silence console outputs from Dashboard hooks
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  console.warn.mockRestore();
  console.log.mockRestore();
  console.error.mockRestore();
});

// Mock axios to prevent real HTTP calls
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
}));

// Mock default export of socket.io-client
jest.mock('socket.io-client', () => ({
  __esModule: true,
  default: () => ({
    on: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

describe("Dashboard Component - Unit Tests", () => {
  const mockUser = { prenom: 'Jean' };

  beforeEach(() => {
    // Mock localStorage.getItem to return a dummy token
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue('dummy-token');
  });

  afterEach(() => {
    jest.clearAllMocks(); // clear mocks but keep module mocks intact
  });

  test("affiche le message de bienvenue avec le prénom", () => {
    render(
      <BrowserRouter>
        <Dashboard user={mockUser} setUser={jest.fn()} />
      </BrowserRouter>
    );
    expect(screen.getByText('Jean')).toBeInTheDocument();
  });

  test("rend la liste des favoris via pastilles colorées", async () => {
    const appareilsFavoris = [
      { _id: '1', nom: 'Lampe', favori: true },
      { _id: '2', nom: 'PC', favori: true }
    ];

    const axios = require('axios');
    axios.get.mockResolvedValueOnce({ data: appareilsFavoris });

    const { container } = render(
      <BrowserRouter>
        <Dashboard user={mockUser} setUser={jest.fn()} />
      </BrowserRouter>
    );

    await screen.findByText('Lampe');
    await screen.findByText('PC');

    const dots = container.querySelectorAll('.bg-primary, .bg-danger');
    expect(dots.length).toBe(2);
  });
});
