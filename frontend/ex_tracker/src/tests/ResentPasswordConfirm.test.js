import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResendPasswordConfirm from "../components/resendpasswordconfirm";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";

// Mock Axios
jest.mock("axios");

// Mock Router: useParams + useNavigate
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: () => mockNavigate,
}));

const renderWithRouter = (ui) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe("ResendPasswordConfirm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------
  // 1. Rendering & CSRF token fetch
  // -------------------------------------
  test("renders new password form and fetches CSRF token", async () => {
    require("react-router-dom").useParams.mockReturnValue({ token: "abc123" });

    axios.get.mockResolvedValue({
      data: { csrfToken: "mock-token" },
      headers: {},
    });

    renderWithRouter(<ResendPasswordConfirm />);

    expect(
      screen.getByText("Reset Your Password")
    ).toBeInTheDocument();

    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("csrf"), {
        withCredentials: true,
      })
    );
  });

  // -------------------------------------
  // 2. Successful password reset
  // -------------------------------------
  test("submits password reset and shows success message", async () => {
    require("react-router-dom").useParams.mockReturnValue({ token: "abc123" });

    axios.get.mockResolvedValue({
      data: { csrfToken: "mock-csrf" },
      headers: {},
    });

    axios.post.mockResolvedValue({
      data: { message: "Password reset successful." },
    });

    renderWithRouter(<ResendPasswordConfirm />);

    fireEvent.change(screen.getByLabelText("New Password"), {
      target: { value: "NewPass123!" },
    });

    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "NewPass123!" },
    });

    jest.useFakeTimers();

    fireEvent.click(screen.getByText("Reset Password"));

// Wait for success message to appear
    await waitFor(() =>
    expect(
        screen.getByText("Password reset successful.")
    ).toBeInTheDocument()
    );

    // Now run timers OUTSIDE waitFor
    jest.runAllTimers();

    // Finally assert navigation
    expect(mockNavigate).toHaveBeenCalledWith("/");

  });

  // -------------------------------------
  // 3. Error response scenario
  // -------------------------------------
  test("shows backend error if reset fails", async () => {
    require("react-router-dom").useParams.mockReturnValue({ token: "abc123" });

    axios.get.mockResolvedValue({
      data: { csrfToken: "mock-csrf" },
      headers: {},
    });

    axios.post.mockRejectedValue({
      response: { data: { error: "Invalid or expired token." } },
    });

    renderWithRouter(<ResendPasswordConfirm />);

    fireEvent.change(screen.getByLabelText("New Password"), {
      target: { value: "Pass123" },
    });

    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "Pass123" },
    });

    fireEvent.click(screen.getByText("Reset Password"));

    await waitFor(() =>
      expect(
        screen.getByText("Invalid or expired token.")
      ).toBeInTheDocument()
    );
  });

  // -------------------------------------
  // 4. Displays error when CSRF fails
  // -------------------------------------
  test("shows CSRF fetch error message", async () => {
    require("react-router-dom").useParams.mockReturnValue({ token: "abc123" });

    axios.get.mockRejectedValue(new Error("CSRF failed"));

    renderWithRouter(<ResendPasswordConfirm />);

    await waitFor(() =>
      expect(
        screen.getByText("Failed to get CSRF token.")
      ).toBeInTheDocument()
    );
  });
});
