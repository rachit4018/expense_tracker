import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import Login from "../components/login"; // Adjust the import path if necessary
import axios from "axios";
import { BrowserRouter } from "react-router-dom";

// Mock axios
jest.mock("axios");

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("Login Component", () => {
  beforeEach(() => {
    // Clear any previous mock calls
    jest.clearAllMocks();
  });

  it("renders login form", async () => {
    renderWithRouter(<Login />);

    expect(await screen.findByText(/Login to Your Account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();

    const passwordInputs = screen.getAllByLabelText(/Password/i);
    expect(passwordInputs[0]).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    renderWithRouter(<Login />);
    const toggleBtn = screen.getByLabelText(/Show password/i);
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/Hide password/i)).toBeInTheDocument();
    });
  });

 
});
