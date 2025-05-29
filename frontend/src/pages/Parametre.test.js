//  Mock d'axios
jest.mock('axios', () => ({
    __esModule: true,
    default: {
      delete: jest.fn(),
    },
  }));
  
  //  Import axios pour pouvoir utiliser axios.delete dans les tests
  import axios from 'axios';
  
  //  Le reste de tes imports
  import React from 'react';
  import { render, screen, fireEvent, waitFor } from '@testing-library/react';
  import Parametre from './Parametre';
  import { MemoryRouter } from 'react-router-dom';
  
  const mockNavigate = jest.fn();
  jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
  }));
  
  const mockSetUser = jest.fn();
  
  

describe('Parametre component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('navigue vers "/profil" quand on clique sur "Modifier mon profil"', () => {
    render(
      <MemoryRouter>
        <Parametre user={{}} setUser={mockSetUser} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Modifier mon profil/i));
    expect(mockNavigate).toHaveBeenCalledWith('/profil');
  });

  it('navigue vers "/preferences" quand on clique sur "Gérer mes préférences"', () => {
    render(
      <MemoryRouter>
        <Parametre user={{}} setUser={mockSetUser} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Gérer mes préférences/i));
    expect(mockNavigate).toHaveBeenCalledWith('/preferences');
  });

  it('supprime le token et redirige vers "/" quand on clique sur "Se déconnecter"', () => {
    localStorage.setItem('token', 'fake-token');

    render(
      <MemoryRouter>
        <Parametre user={{}} setUser={mockSetUser} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Se déconnecter/i));
    expect(localStorage.getItem('token')).toBe(null);
    expect(mockSetUser).toHaveBeenCalledWith(null);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('appelle axios.delete et supprime le compte si confirmé', async () => {
    axios.delete.mockResolvedValue({});
    window.confirm = jest.fn(() => true);
    localStorage.setItem('token', 'fake-token');

    render(
      <MemoryRouter>
        <Parametre user={{}} setUser={mockSetUser} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Supprimer mon compte/i));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/api/utilisateurs/supprimer-compte`,
        expect.objectContaining({
          headers: { Authorization: 'Bearer fake-token' }
        })
      );
    });

    expect(mockSetUser).toHaveBeenCalledWith(null);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it("n'appelle PAS axios.delete si l'utilisateur annule la confirmation", () => {
    window.confirm = jest.fn(() => false);

    render(
      <MemoryRouter>
        <Parametre user={{}} setUser={mockSetUser} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Supprimer mon compte/i));
    expect(axios.delete).not.toHaveBeenCalled();
  });
});
