
jest.mock("axios", () => ({
  get: jest.fn(),
  put: jest.fn(),
}));

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Preferences from "./Preferences";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("Preferences Component", () => {
  beforeEach(() => {
    localStorage.setItem("token", "fake-token");
    document.body.className = ""; // reset
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("affiche les préférences initiales depuis l'API", async () => {
    const mockUserPrefs = {
      preferences: {
        unite: "Wh",
        theme: "sombre",
        emailNotifications: false,
      },
    };
  
    axios.get.mockResolvedValue({ data: mockUserPrefs });
  
    render(
      <MemoryRouter>
        <Preferences user={{}} setUser={jest.fn()} />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /unité/i })).toHaveValue("Wh");
      expect(screen.getByRole("combobox", { name: /thème/i })).toHaveValue("sombre");
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });
  });
  

  it("change et envoie les préférences à l'API", async () => {
    axios.get.mockResolvedValue({
      data: {
        preferences: {
          unite: "kWh",
          theme: "clair",
          emailNotifications: true,
        },
      },
    });

    axios.put.mockResolvedValue({});

    render(
      <MemoryRouter>
        <Preferences user={{}} setUser={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("kWh")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue("kWh"), {
      target: { value: "Wh", name: "unite" },
    });

    fireEvent.click(screen.getByText(/Sauvegarder/i));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/api/utilisateurs/me`,
        {
          preferences: expect.objectContaining({ unite: "Wh" }),
        },
        expect.any(Object)
      );
    });

    expect(screen.getByText(/Préférences enregistrées/)).toBeInTheDocument();
  });
});
