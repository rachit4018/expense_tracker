import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Expense from "../components/expense"; // Adjust the import path if necessary
import { MemoryRouter, Route, Routes } from "react-router-dom";

import {jest} from '@jest/globals';
const axios = require('axios');

// Mock Axios
jest.mock("axios");

// Mock data
const mockCategories = {
  data: {
    categories: [
      { id: 1, name: "Food" },
      { id: 2, name: "Travel" },
    ],
  },
};

const mockUser = { username: "john_doe" };

// Helper to render with router and params
const renderWithRouter = (ui, { route = "/expense/1" } = {}) => {
  window.history.pushState({}, "Test page", route);
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/expense/:groupId"
          element={<Expense />}
        />
      </Routes>
    </MemoryRouter>,
    {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route
              path="/expense/:groupId"
              element={<Expense />}
            />
          </Routes>
        </MemoryRouter>
      ),
    }
  );
};

describe("Expense Component", () => {
  beforeEach(() => {
    axios.get.mockResolvedValue(mockCategories);
    localStorage.setItem("token", "dummy-token");
  });

  it("renders the form fields", async () => {
    renderWithRouter(<Expense />, {
      route: "/expense/1",
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
      expect(screen.getByTestId("split_type")).toBeInTheDocument();
      expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    });
  });

  it("allows form submission", async () => {
    axios.post.mockResolvedValue({ status: 201 });

    renderWithRouter(<Expense />, {
      route: "/expense/1",
    });

    await waitFor(() => screen.getByLabelText(/Category/i)); // Wait for categories to load

    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "150" },
    });

    fireEvent.change(screen.getByLabelText(/Category/i), {
      target: { value: "1" },
    });

    fireEvent.click(screen.getByTestId(/add-expense-button/i));

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("add_expense_api"),
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.any(Object),
        })
      )
    );
  });

  it("shows error message on API failure", async () => {
    axios.post.mockRejectedValue(new Error("API Error"));

    renderWithRouter(<Expense />, {
      route: "/expense/1",
    });

    await waitFor(() => screen.getByLabelText(/Category/i));

    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "150" },
    });

    fireEvent.change(screen.getByLabelText(/Category/i), {
      target: { value: "1" },
    });

    fireEvent.click(screen.getByTestId(/add-expense-button/i));

    await waitFor(() => {
      expect(screen.getByText(/Failed to add expense/i)).toBeInTheDocument();
    });
  });
});
