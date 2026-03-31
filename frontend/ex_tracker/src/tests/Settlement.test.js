import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Settlements from "../components/settlements";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

jest.mock("../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

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

const mockUser = {
  username: "john_doe",
  college: "Test University",
  semester: "5th",
};

const renderWithRouter = () =>
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/settlements/john_doe",
          state: { user: mockUser },
        },
      ]}
    >
      <Routes>
        <Route path="/settlements/:username" element={<Settlements />} />
      </Routes>
    </MemoryRouter>
  );

describe("Settlements Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("token", "mock-token");
    localStorage.setItem("access_token", "mock-token");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders settlements after loading", async () => {
    axiosInstance.get
      .mockResolvedValueOnce({ headers: {}, data: { csrfToken: "mock-csrf" } })
      .mockResolvedValueOnce({ data: { settlements: mockSettlements } });

    renderWithRouter();

    expect(screen.getByText(/Your Settlements/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Trip to Banff")).toBeInTheDocument();
      expect(screen.getByText("Weekend Getaway")).toBeInTheDocument();
    });

    expect(axiosInstance.get).toHaveBeenNthCalledWith(1, "/csrf/");
    expect(axiosInstance.get).toHaveBeenNthCalledWith(
      2,
      `/api/v1/settlements/${mockUser.username}/`,
      {
        headers: {
          "X-Username": mockUser.username,
        },
      }
    );
  });

  it("displays error message if fetching settlements fails", async () => {
    axiosInstance.get
      .mockResolvedValueOnce({ headers: {}, data: { csrfToken: "mock-csrf" } })
      .mockRejectedValueOnce(new Error("Fetch failed"));

    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText(/Error fetching settlements./i)
      ).toBeInTheDocument();
    });
  });

  it("sorts settlements by clicking table headers", async () => {
    axiosInstance.get
      .mockResolvedValueOnce({ headers: {}, data: { csrfToken: "mock-csrf" } })
      .mockResolvedValueOnce({ data: { settlements: mockSettlements } });

    renderWithRouter();

    await waitFor(() => screen.getByText("Trip to Banff"));

    let firstGroupCell = screen.getAllByRole("cell")[0];
    expect(firstGroupCell.textContent).toBe("Trip to Banff");

    fireEvent.click(screen.getByText(/Amount/i));
    firstGroupCell = screen.getAllByRole("cell")[0];
    expect(firstGroupCell.textContent).toBe("Weekend Getaway");

    fireEvent.click(screen.getByText(/Amount/i));
    firstGroupCell = screen.getAllByRole("cell")[0];
    expect(firstGroupCell.textContent).toBe("Trip to Banff");
  });

  it("marks a pending settlement as completed", async () => {
    axiosInstance.get
      .mockResolvedValueOnce({ headers: {}, data: { csrfToken: "mock-csrf" } })
      .mockResolvedValueOnce({ data: { settlements: mockSettlements } });

    axiosInstance.patch.mockResolvedValueOnce({ status: 200 });

    renderWithRouter();

    await waitFor(() => screen.getByText("Trip to Banff"));

    const markCompletedButton = screen.getByRole("button", {
      name: /Mark as Completed/i,
    });
    fireEvent.click(markCompletedButton);

    await waitFor(() => {
      expect(axiosInstance.patch).toHaveBeenCalledWith(
        "/api/v1/settlements/1/",
        { payment_status: "Completed" },
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Username": mockUser.username,
            "X-CSRFToken": "mock-csrf",
          }),
        })
      );
    });

    await waitFor(() => {
    expect(screen.getAllByTestId("completed-status").length).toBeGreaterThan(0);
  });
  });

  it("shows error if marking completed fails", async () => {
    axiosInstance.get
      .mockResolvedValueOnce({ headers: {}, data: { csrfToken: "mock-csrf" } })
      .mockResolvedValueOnce({ data: { settlements: mockSettlements } });

    axiosInstance.patch.mockRejectedValueOnce({
      response: {
        data: {
          error: "Failed to update payment status. Please try again.",
        },
      },
    });

    renderWithRouter();

    await waitFor(() => screen.getByText("Trip to Banff"));

    const markCompletedButton = screen.getByRole("button", {
      name: /Mark as Completed/i,
    });
    fireEvent.click(markCompletedButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to update payment status. Please try again./i)
      ).toBeInTheDocument();
    });
  });
});