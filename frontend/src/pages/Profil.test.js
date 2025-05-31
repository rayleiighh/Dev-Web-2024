import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Profil from './Profil';
import { MemoryRouter } from 'react-router-dom';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    put: jest.fn(),
    get: jest.fn(),
    patch: jest.fn()
  }
}));
import axios from 'axios';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Profil Component', () => {
  const mockUser = {
    nom: 'Test User',
    email: 'test@example.com'
  };

  const mockSetUser = jest.fn();

  beforeEach(() => {
    axios.put.mockReset();
    axios.get.mockReset();
    axios.patch.mockReset();
  });

  it('affiche les informations utilisateur', () => {
    render(
      <MemoryRouter>
        <Profil user={mockUser} setUser={mockSetUser} />
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('met à jour les champs de formulaire', () => {
    render(
      <MemoryRouter>
        <Profil user={mockUser} setUser={mockSetUser} />
      </MemoryRouter>
    );

    const nomInput = screen.getByDisplayValue('Test User');
    fireEvent.change(nomInput, { target: { value: 'Nouveau Nom' } });
    expect(nomInput.value).toBe('Nouveau Nom');
  });

  it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
    render(
      <MemoryRouter>
        <Profil user={mockUser} setUser={mockSetUser} />
      </MemoryRouter>
    );

    const newPassInput = screen.getAllByDisplayValue('')[1];
    const confirmPassInput = screen.getAllByDisplayValue('')[2];

    fireEvent.change(newPassInput, {
      target: { value: 'abc123' },
    });
    fireEvent.change(confirmPassInput, {
      target: { value: 'différent' },
    });
    fireEvent.click(screen.getByText(/Enregistrer/i));

    await waitFor(() => {
      expect(screen.getByText(/ne correspondent pas/i)).toBeInTheDocument();
    });
  });

  it('appelle axios.patch et setUser avec succès', async () => {
    axios.patch.mockResolvedValue({});
    axios.get.mockResolvedValue({ data: mockUser });

    render(
      <MemoryRouter>
        <Profil user={mockUser} setUser={mockSetUser} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Enregistrer/i));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/api/utilisateurs/profil`,
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer')
          })
        })
      );
      expect(axios.get).toHaveBeenCalled();
      expect(mockSetUser).toHaveBeenCalledWith(mockUser);
      expect(screen.getByText(/succès/i)).toBeInTheDocument();
    });
  });
});
