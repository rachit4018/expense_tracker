import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import Group from "../components/group"; // Adjust path if needed
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";

jest.mock("axios");

// Mock localStorage and CSRF token
beforeEach(() => {
  localStorage.setItem("token", "mock-token");
  document.cookie = "csrftoken=mock-csrf";
  window.alert = jest.fn(); // mock alert globally
});

const mockGroupData = {
  group: {
    name: "Trip to Banff",
    created_by: "john_doe",
    members: [
      { username: "john_doe" },
      { username: "jane_doe" },
    ],
  },
  expenses: [
    {
      id: 1,
      amount: 100,
      created_by: "john_doe",
      date: "2025-07-25",
    },
  ],
  available_members: [
    { username: "alex" },
  ],
};

const mockUser = { username: "john_doe" };

const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/group/1", state: { user: mockUser } }]}>
      <Routes>
        <Route
          path="/group/:groupId"
          element={<Group location={{ state: { user: mockUser } }} />}
        />
      </Routes>
    </MemoryRouter>
  );

describe("Group Page", () => {
  it("renders loading state initially", async () => {
    axios.get.mockResolvedValueOnce({ data: mockGroupData });

    renderWithRouter();
    expect(screen.getByText(/Loading group details/i)).toBeInTheDocument();
  });

  it("displays group details after fetch", async () => {
    axios.get.mockResolvedValueOnce({ data: mockGroupData });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Group Details")).toBeInTheDocument();
    });

    expect(screen.getByText("Trip to Banff")).toBeInTheDocument();

    // Use getAllByText for possible duplicates
    const memberElements = screen.getAllByText("john_doe");
    expect(memberElements.length).toBeGreaterThan(0);

    expect(screen.getByText(/Expenses/i)).toBeInTheDocument();
    expect(screen.getByText(/₹100/)).toBeInTheDocument();
    expect(screen.getByText(/2025-07-25/)).toBeInTheDocument();
  });

  it("shows error message if fetch fails", async () => {
    axios.get.mockRejectedValueOnce(new Error("Fetch failed"));

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Error fetching group details.")).toBeInTheDocument();
    });
  });

  it("alerts when trying to add member without selection", async () => {
    axios.get.mockResolvedValueOnce({ data: mockGroupData });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByTestId("add-member-button")).toBeInTheDocument();
    });

    const addButton = screen.getByTestId("add-member-button");
    fireEvent.click(addButton);

    expect(window.alert).toHaveBeenCalledWith("Please select a member.");
  });

  it("adds a member when selected", async () => {
    axios.get.mockResolvedValueOnce({ data: mockGroupData });
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByTestId("add-member-button")).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "alex" } });

    const addButton = screen.getByTestId("add-member-button");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/group/1/add_member/"),
        { username: "alex" },
        expect.any(Object)
      );
    });
  });
});
