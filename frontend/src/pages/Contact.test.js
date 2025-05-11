// src/pages/Contact.test.js
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Contact from './Contact';

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

describe('Contact Page', () => {
  const user = { nom: 'Dupont', email: 'dupont@example.com' };

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    // Silence console.error to avoid clutter in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    // Restore console.error
    console.error.mockRestore();
  });

  it('renders form elements correctly', () => {
    render(<Contact user={user} />);
    expect(screen.getByPlaceholderText(/Votre message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /envoyer/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument(); // back button
  });

  it('submits the form successfully and displays confirmation', async () => {
    const mockResponse = { message: 'Message reçu !' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    render(<Contact user={user} />);

    const textarea = screen.getByPlaceholderText(/Votre message/i);
    const submitButton = screen.getByRole('button', { name: /envoyer/i });

    // Type message and submit
    await userEvent.type(textarea, 'Bonjour !');
    userEvent.click(submitButton);

    // Button becomes disabled while loading
    expect(submitButton).toBeDisabled();

    // Wait for fetch to be called with correct args
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/contact',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom: user.nom,
            email: user.email,
            message: 'Bonjour !'
          })
        })
      );
    });

    // After fetch resolves, confirmation is shown and textarea is cleared
    expect(await screen.findByText(mockResponse.message)).toBeInTheDocument();
    expect(textarea).toHaveValue('');
    expect(submitButton).toBeEnabled();
  });

  it('handles fetch failure and displays error message', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<Contact user={user} />);

    const textarea = screen.getByPlaceholderText(/Votre message/i);
    const submitButton = screen.getByRole('button', { name: /envoyer/i });

    await userEvent.type(textarea, 'Test erreur');
    userEvent.click(submitButton);

    // Wait for error handling
    expect(await screen.findByText(/Une erreur s'est produite./i)).toBeInTheDocument();
    expect(submitButton).toBeEnabled();
  });

  it('submits form on Enter key without Shift', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'OK' }) });

    render(<Contact user={user} />);
    const textarea = screen.getByPlaceholderText(/Votre message/i);

    // Type then press Enter
    await userEvent.type(textarea, 'Entrée test');
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    expect(await screen.findByText('OK')).toBeInTheDocument();
  });

  it('navigates back when back button is clicked', () => {
    render(<Contact user={user} />);
    const backButton = screen.getByRole('button', { name: '' });
    userEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
