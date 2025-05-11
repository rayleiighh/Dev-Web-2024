// src/pages/Historique.test.js
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Historique from './Historique';
import { BrowserRouter } from 'react-router-dom';

// Mock Line component from react-chartjs-2 to avoid rendering canvas
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="chart">Chart Placeholder</div>
}));

// Silence console outputs
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
    expect(screen.getByText(/Chargement en cours/i)).toBeInTheDocument();
  });

  test('affiche la table avec message "Aucune donnée disponible"', async () => {
    render(
      <BrowserRouter>
        <Historique />
      </BrowserRouter>
    );
    // Attendre la fin du chargement
    await waitFor(() => expect(screen.queryByText(/Chargement en cours/i)).not.toBeInTheDocument());
    // Chart placeholder
    expect(screen.getByTestId('chart')).toBeInTheDocument();
    // Vérifier la ligne de fallback
    expect(screen.getByText('Aucune donnée disponible')).toBeInTheDocument();
  });

    test('les champs de date et bouton Export existent', async () => {
    const { container } = render(
      <BrowserRouter>
        <Historique />
      </BrowserRouter>
    );
    // Attendre fin chargement
    await waitFor(() => expect(screen.queryByText(/Chargement en cours/i)).not.toBeInTheDocument());

    // Deux inputs type date existent
    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBe(2);
    // Bouton Export CSV
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
  });
});
