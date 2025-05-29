import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from './Register';
import { MemoryRouter } from 'react-router-dom';

// Mock de axios
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn()
  }
}));
import axios from 'axios';

// Mock de useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Register Component', () => {
  beforeEach(() => {
    axios.post.mockReset();
    mockNavigate.mockReset();
  });

  it('affiche les champs du formulaire', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Prénom')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nom')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirmer le mot de passe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Numéro de série de la multiprise')).toBeInTheDocument();
  });

  it("affiche une erreur si les mots de passe ne correspondent pas", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Mot de passe'), {
      target: { value: '123456' }
    });
    fireEvent.change(screen.getByPlaceholderText('Confirmer le mot de passe'), {
      target: { value: 'abcdef' }
    });
    fireEvent.click(screen.getByText(/S'inscrire/i));

    expect(screen.getByText(/Les mots de passe ne correspondent pas/i)).toBeInTheDocument();
  });

  it("envoie les données correctes à l'API et redirige", async () => {
    axios.post.mockResolvedValue({});

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Prénom'), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByPlaceholderText('Nom'), {
      target: { value: 'Doe' }
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Mot de passe'), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByPlaceholderText('Confirmer le mot de passe'), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByPlaceholderText('Numéro de série de la multiprise'), {
      target: { value: 'ABC123' }
    });
    fireEvent.click(screen.getByText(/S'inscrire/i));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/api/utilisateurs/register`,
        expect.objectContaining({
          prenom: 'John',
          nom: 'Doe',
          email: 'john@example.com',
          motDePasse: 'password123',
          deviceId: 'ABC123'
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it("affiche une erreur en cas d'échec de l'inscription", async () => {
    axios.post.mockRejectedValue(new Error('Erreur')); // simulate failure

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Prénom'), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByPlaceholderText('Nom'), {
      target: { value: 'Doe' }
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Mot de passe'), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByPlaceholderText('Confirmer le mot de passe'), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByPlaceholderText('Numéro de série de la multiprise'), {
      target: { value: 'ABC123' }
    });
    fireEvent.click(screen.getByText(/S'inscrire/i));

    await waitFor(() => {
      expect(screen.getByText(/Échec de l’inscription/i)).toBeInTheDocument();
    });
  });
});
