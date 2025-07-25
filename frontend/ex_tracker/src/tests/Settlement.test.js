import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Settlements from "../components/Settlements"; // adjust path as needed
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";

jest.mock("axios");

const mockUser = {
  username: "john_doe",
};

const mockSettlements = [
  {
    id: 1,
    group_name: "Trip to Banff",
    amount: 200,
    payment_status: "Pending",
    settlement_method: "Cash",
    due_date: "2025-08-01",
    settlement_date: "",
  },
  {
    id: 2,
    group_name: "Weekend Getaway",
    amount: 150,
    payment_status: "Completed",
    settlement_method: "Bank Transfer",
    due_date: "2025-07-20",
    settlement_date: "2025-07-19",
  },
];

const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/settlements/john_doe", state: { user: mockUser } }]}>
      <Routes>
        <Route path="/settlements/:username" element={<Settlements />} />
      </Routes>
    </MemoryRouter>
  );

describe("Settlements Component", () => {
  beforeEach(() => {
    localStorage.setItem("token", "mock-token");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading initially and then displays settlements", async () => {
    axios.get
      .mockResolvedValueOnce({ headers: {}, data: { csrfToken: "mock-csrf" } }) // CSRF token fetch
      .mockResolvedValueOnce({ data: { settlements: mockSettlements } }); // settlements fetch

    renderWithRouter();

    expect(screen.getByText(/Your Settlements/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Trip to Banff")).toBeInTheDocument();
      expect(screen.getByText("Weekend Getaway")).toBeInTheDocument();
    });
  });

  it("displays error message if fetching settlements fails", async () => {
    axios.get
      .mockResolvedValueOnce({ headers: {}, data: { csrfToken: "mock-csrf" } })
      .mockRejectedValueOnce(new Error("Fetch failed"));

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/Error fetching settlements./i)).toBeInTheDocument();
    });
  });

  it("sorts settlements by clicking table headers", async () => {
    axios.get
      .mockResolvedValueOnce({ headers: {}, data: { csrfToken: "mock-csrf" } })
      .mockResolvedValueOnce({ data: { settlements: mockSettlements } });

    renderWithRouter();

    // Wait for data to load
    await waitFor(() => screen.getByText("Trip to Banff"));

    // Initially sorted by group_name asc, first row should be "Trip to Banff"
    let firstGroupCell = screen.getAllByRole("cell")[0];
    expect(firstGroupCell.textContent).toBe("Trip to Banff");

    // Click to sort by amount ascending
    fireEvent.click(screen.getByText(/Amount/i));
    firstGroupCell = screen.getAllByRole("cell")[0];
    expect(firstGroupCell.textContent).toBe("Weekend Getaway");

    // Click to sort by amount descending
    fireEvent.click(screen.getByText(/Amount/i));
    firstGroupCell = screen.getAllByRole("cell")[0];
    expect(firstGroupCell.textContent).toBe("Trip to Banff");
  });

  it("marks a pending settlement as completed", async () => {
    axios.get
      .mockResolvedValueOnce({ headers: {}, data: { csrfToken: "mock-csrf" } })
      .mockResolvedValueOnce({ data: { settlements: mockSettlements } });

    axios.patch.mockResolvedValueOnce({ status: 200 });

    renderWithRouter();

    await waitFor(() => screen.getByText("Trip to Banff"));

    const markCompletedButton = screen.getByRole("button", { name: /Mark as Completed/i });
    fireEvent.click(markCompletedButton);

    await waitFor(() => {
      expect(screen.getByText(/Payment status updated successfully!/i)).toBeInTheDocument();
    });
  });

  it("shows error if marking completed fails", async () => {
    axios.get
      .mockResolvedValueOnce({ headers: {}, data: { csrfToken: "mock-csrf" } })
      .mockResolvedValueOnce({ data: { settlements: mockSettlements } });

    axios.patch.mockRejectedValueOnce(new Error("Patch failed"));

    renderWithRouter();

    await waitFor(() => screen.getByText("Trip to Banff"));

    const markCompletedButton = screen.getByRole("button", { name: /Mark as Completed/i });
    fireEvent.click(markCompletedButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to update payment status. Please try again./i)).toBeInTheDocument();
    });
  });
});
