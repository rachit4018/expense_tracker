import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../components/home"; // Adjust the import path if necessary
import axios from "axios";
import { BrowserRouter, MemoryRouter } from "react-router-dom";

// Mock Axios
jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    state: {
      user: {
        username: "testuser",
        college: "Test College",
        semester: "5th",
        default_payment_methods: "UPI",
        created_by: "testuser",
      },
    },
  }),
}));

describe("Home Component", () => {
  const mockGroups = {
    data: {
      groups: [
        { group_id: 1, name: "Group One" },
        { group_id: 2, name: "Group Two" },
      ],
    },
  };

  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("groups")) {
        return Promise.resolve(mockGroups);
      }
      if (url.includes("csrf")) {
        return Promise.resolve({ status: 204 });
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders user information", async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText(/Welcome, testuser/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Group One")).toBeInTheDocument();
      expect(screen.getByText("Group Two")).toBeInTheDocument();
    });

    expect(screen.getByText("Test College")).toBeInTheDocument();
    expect(screen.getByText("5th")).toBeInTheDocument();
    expect(screen.getByText("UPI")).toBeInTheDocument();
  });

  test("handles create group submission", async () => {
    axios.post.mockResolvedValue({ status: 201 });

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText("Enter group name");
    const button = screen.getByText("Create Group");

    fireEvent.change(input, { target: { value: "New Test Group" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("create"),
        { name: "New Test Group", created_by: "testuser" },
        expect.any(Object)
      );
    });
  });

  test("navigates to settlements", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("settlements-button"));
    expect(mockNavigate).toHaveBeenCalledWith("/settlements/testuser", {
      state: { user: expect.any(Object) },
    });
  });

  test("navigates to group page", async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Group One"));
    fireEvent.click(screen.getByText("Group One"));

    expect(mockNavigate).toHaveBeenCalledWith("/groups/1", {
      state: { user: expect.any(Object) },
    });
  });
});
