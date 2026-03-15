import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Expense from "../components/expense";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

jest.mock("../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockCategories = {
  data: {
    categories: [
      { id: 1, name: "Food" },
      { id: 2, name: "Travel" },
    ],
  },
};

const mockUser = { username: "john_doe" };

const renderWithRouter = ({ route = "/expense/1", state = { user: mockUser } } = {}) => {
  return render(
    <MemoryRouter initialEntries={[{ pathname: route, state }]}>
      <Routes>
        <Route path="/expense/:groupId" element={<Expense />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("Expense Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axiosInstance.get.mockResolvedValue(mockCategories);
    localStorage.setItem("token", "dummy-token");
    localStorage.setItem("access_token", "dummy-token");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders the form fields", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
      expect(screen.getByTestId("split_type")).toBeInTheDocument();
      expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    });

    expect(axiosInstance.get).toHaveBeenCalledWith("/api/v1/categories/");
  });

  it("allows form submission", async () => {
    axiosInstance.post.mockResolvedValue({ status: 201 });

    renderWithRouter();

    await waitFor(() => screen.getByLabelText(/Category/i));

    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "150" },
    });

    fireEvent.change(screen.getByLabelText(/Category/i), {
      target: { value: "1" },
    });

    fireEvent.click(screen.getByTestId("add-expense-button"));

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith(
        "/api/v1/expenses/1/add/",
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "multipart/form-data",
          }),
        })
      );
    });
  });

  it("shows error message on API failure", async () => {
    axiosInstance.post.mockRejectedValue({
      response: {
        data: {
          error: "Failed to add expense. Please try again.",
        },
      },
    });

    renderWithRouter();

    await waitFor(() => screen.getByLabelText(/Category/i));

    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "150" },
    });

    fireEvent.change(screen.getByLabelText(/Category/i), {
      target: { value: "1" },
    });

    fireEvent.click(screen.getByTestId("add-expense-button"));

    await waitFor(() => {
      expect(screen.getByText(/Failed to add expense/i)).toBeInTheDocument();
    });
  });
});