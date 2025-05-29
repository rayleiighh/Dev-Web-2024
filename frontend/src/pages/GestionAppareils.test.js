import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GestionAppareils from './GestionAppareils';
import { BrowserRouter } from 'react-router-dom';

// Silence console outputs from the component
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

// Mock socket.io-client to prevent real connections
jest.mock('socket.io-client', () => ({
  io: () => ({ on: jest.fn(), off: jest.fn() }),
}));

describe('GestionAppareils Component - Unit Tests', () => {
  const mockPrises = [
    { _id: '1', nom: 'Lampe', etat: false, modeNuit: { actif: false } },
    { _id: '2', nom: 'Ventilateur', etat: true, modeNuit: { actif: false } }
  ];

  beforeEach(() => {
    // Mock token
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue('token');
    // Mock fetch for appareils
    global.fetch = jest.fn((url) => {
      if (url.endsWith('/api/appareils')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPrises)
        });
      }
      return Promise.resolve({ ok: true });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('affiche le titre de la page', () => {
    render(
      <BrowserRouter>
        <GestionAppareils />
      </BrowserRouter>
    );
    expect(screen.getByText('Gestion des appareils')).toBeInTheDocument();
  });

  test('charge et affiche la liste des prises', async () => {
    render(
      <BrowserRouter>
        <GestionAppareils />
      </BrowserRouter>
    );
    // Attend l'affichage de chaque appareil
    await waitFor(() => {
      expect(screen.getByText('Lampe')).toBeInTheDocument();
      expect(screen.getByText('Ventilateur')).toBeInTheDocument();
    });
  });

  test('ouvre et ferme le modal de mode nuit', async () => {
    render(
      <BrowserRouter>
        <GestionAppareils />
      </BrowserRouter>
    );
    // Bouton config mode nuit (moon icon)
    const button = await screen.findByTitle('Configurer le mode nuit');
    fireEvent.click(button);
    // Le titre du modal apparaît
    expect(screen.getByText(' Configuration du Mode Nuit')).toBeInTheDocument();
    // Clique sur Annuler ferme le modal
    fireEvent.click(screen.getByText('Annuler'));
    await waitFor(() => {
      expect(screen.queryByText(' Configuration du Mode Nuit')).not.toBeInTheDocument();
    });
  });
});
