import { render, screen, waitFor } from '@testing-library/react';
import Historique from './Historique';
import { BrowserRouter } from 'react-router-dom';

// Test de base
test('should pass', () => {
  expect(1 + 1).toBe(2);
});

// Mock du composant Line pour éviter de charger le canvas réel
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="chart">Chart Placeholder</div>
}));

// Suppression des logs pour les tests
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  console.warn.mockRestore();
  console.error.mockRestore();
});

describe('Historique Component - Unit Tests', () => {
  beforeEach(() => {
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue('token');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('affiche le spinner au chargement', () => {
    render(
      <BrowserRouter>
        <Historique />
      </BrowserRouter>
    );
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  test('affiche la table avec message "Aucune donnée disponible"', async () => {
    render(
      <BrowserRouter>
        <Historique />
      </BrowserRouter>
    );

    // Attendre la fin du chargement
    await waitFor(() =>
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
    );

    expect(screen.getByTestId('chart')).toBeInTheDocument();
    expect(screen.getByText('Aucune donnée disponible')).toBeInTheDocument();
  });

  test('les champs de date et bouton Export existent', async () => {
    const { container } = render(
      <BrowserRouter>
        <Historique />
      </BrowserRouter>
    );

    await waitFor(() =>
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
    );

    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBe(2);
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
  });
});
