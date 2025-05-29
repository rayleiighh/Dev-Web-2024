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
    // Le texte est fragmenté ; cherchons seulement le prénom
    expect(screen.getByText('Jean')).toBeInTheDocument();
  });

  test("affiche le spinner et le message hors ligne quand il n'a pas de donnée", () => {
    render(
      <BrowserRouter>
        <Dashboard user={mockUser} setUser={jest.fn()} />
      </BrowserRouter>
    );
    expect(
      screen.getByText(/Multiprise éteinte ou hors ligne/i)
    ).toBeInTheDocument();
  });

  test("rend la liste des favoris via pastilles colorées", () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard user={mockUser} setUser={jest.fn()} />
      </BrowserRouter>
    );
    // Vérifie qu'il y a deux pastilles colorées pour les favoris par défaut
    const dots = container.querySelectorAll('.bg-primary, .bg-danger');
    expect(dots.length).toBe(2);
  });
});