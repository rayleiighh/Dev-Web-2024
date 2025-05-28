import { render, screen, waitFor } from '@testing-library/react';
import VerifierEmail from './VerifierEmail';
import { MemoryRouter } from 'react-router-dom';

// Mock de axios
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));
import axios from 'axios';

// Mock de useNavigate et useSearchParams
const mockNavigate = jest.fn();
const mockSearchParams = new URLSearchParams('token=valid-token');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}));

describe('VerifierEmail Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le message de chargement', () => {
    render(
      <MemoryRouter>
        <VerifierEmail />
      </MemoryRouter>
    );

    expect(screen.getByText(/Vérification en cours/i)).toBeInTheDocument();
  });

  it('affiche le message de succès et le bouton de connexion', async () => {
    axios.get.mockResolvedValue({ data: { message: 'Email vérifié avec succès !' } });

    render(
      <MemoryRouter>
        <VerifierEmail />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/compte confirmé/i)).toBeInTheDocument();
      expect(screen.getByText(/Email vérifié avec succès/i)).toBeInTheDocument();
      expect(screen.getByText(/Se connecter/i)).toBeInTheDocument();
    });
  });

  it('affiche le message d’erreur et le bouton de retour', async () => {
    axios.get.mockRejectedValue({ response: { data: { message: 'Token invalide ou expiré.' } } });

    render(
      <MemoryRouter>
        <VerifierEmail />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Erreur/i)).toBeInTheDocument();
      expect(screen.getByText(/Token invalide ou expiré/i)).toBeInTheDocument();
      expect(screen.getByText(/Retour à l'inscription/i)).toBeInTheDocument();
    });
  });
});
