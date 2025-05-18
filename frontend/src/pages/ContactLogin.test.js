// src/pages/ContactLogin.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ContactLogin from './ContactLogin';

// Silence React Router Future Flag warnings
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => {
  console.warn.mockRestore();
});

describe('ContactLogin Component', () => {
  beforeEach(() => {
    // Mock global.fetch to return a confirmation message
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Message envoyé avec succès !' }),
      })
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('rend correctement les champs du formulaire', () => {
    render(
      <BrowserRouter>
        <ContactLogin />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText('Votre nom')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Votre email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Votre message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /envoyer le message/i })).toBeInTheDocument();
  });

  test('envoie le formulaire et affiche un message de confirmation', async () => {
    render(
      <BrowserRouter>
        <ContactLogin />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Votre nom'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText('Votre email'), { target: { value: 'alice@mail.com' } });
    fireEvent.change(screen.getByPlaceholderText('Votre message'), { target: { value: 'Message test' } });

    fireEvent.click(screen.getByRole('button', { name: /envoyer le message/i }));

    await waitFor(() =>
      expect(screen.getByText('Message envoyé avec succès !')).toBeInTheDocument()
    );
  });
});
