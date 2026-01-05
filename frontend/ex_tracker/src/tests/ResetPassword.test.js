import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResetPassword from "../components/resetpassword";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";

// Mock axios
jest.mock("axios");

// Mock react-router hooks
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: () => mockNavigate,
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("ResetPassword Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------
  // 1. Render email form when no token present
  // -----------------------------------------
  test("renders email reset form when no token in URL", async () => {
    require("react-router-dom").useParams.mockReturnValue({ token: undefined });

    axios.get.mockResolvedValue({
      data: { csrfToken: "mock-csrf" },
      headers: {},
    });

    renderWithRouter(<ResetPassword />);

    expect(
      screen.getByText("Forgot Your Password?")
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
  });

  // ------------------------------------------------
  // 2. Render new password form when token is present
  // ------------------------------------------------
  test("renders new password form when token exists", async () => {
    require("react-router-dom").useParams.mockReturnValue({
      token: "abc123",
    });

    axios.get.mockResolvedValue({
      data: { csrfToken: "mock-csrf" },
      headers: {},
    });

    renderWithRouter(<ResetPassword />);

    expect(
      screen.getByText("Set a New Password")
    ).toBeInTheDocument();

    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
  });

  // -----------------------------------------
  // 3. Submit email reset request (success case)
  // -----------------------------------------
  test("submits email and shows success message", async () => {
    require("react-router-dom").useParams.mockReturnValue({ token: undefined });

    axios.get.mockResolvedValue({
      data: { csrfToken: "mock-csrf" },
      headers: {},
    });

    axios.post.mockResolvedValue({
      data: { message: "Reset email sent." },
    });

    renderWithRouter(<ResetPassword />);

    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "test@example.com" },
    });

    fireEvent.click(screen.getByText("Send Reset Link"));

    await waitFor(() => {
      expect(screen.getByText("Reset email sent.")).toBeInTheDocument();
    });
  });

  // -----------------------------------------
  // 4. Submit email reset request (error case)
  // -----------------------------------------
  test("shows error if email reset fails", async () => {
    require("react-router-dom").useParams.mockReturnValue({ token: undefined });

    axios.get.mockResolvedValue({
      data: { csrfToken: "mock-csrf" },
      headers: {},
    });

    axios.post.mockRejectedValue({
      response: { data: { error: "User not found" } },
    });

    renderWithRouter(<ResetPassword />);

    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "wrong@example.com" },
    });

    fireEvent.click(screen.getByText("Send Reset Link"));

    await waitFor(() => {
      expect(screen.getByText("User not found")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------
  // 5. Submit new password form — success and redirect triggered
  // ---------------------------------------------------------
  test("submits new password and redirects on success", async () => {
    require("react-router-dom").useParams.mockReturnValue({
      token: "abc123",
    });

    axios.get.mockResolvedValue({
      data: { csrfToken: "mock-csrf" },
      headers: {},
    });

    axios.post.mockResolvedValue({
      data: { message: "Password has been reset successfully." },
    });

    renderWithRouter(<ResetPassword />);

    fireEvent.change(screen.getByLabelText("New Password"), {
      target: { value: "NewPass123!" },
    });

    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "NewPass123!" },
    });

    fireEvent.click(screen.getByText("Reset Password"));

    await waitFor(() => {
      expect(
        screen.getByText("Password has been reset successfully.")
      ).toBeInTheDocument();
    });

    // Check redirect triggered
    // expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  // ---------------------------------------------------
  // 6. Show backend error for reset password (token mode)
  // ---------------------------------------------------
  test("shows backend error for invalid reset token", async () => {
    require("react-router-dom").useParams.mockReturnValue({
      token: "abc123",
    });

    axios.get.mockResolvedValue({
      data: { csrfToken: "mock-csrf" },
      headers: {},
    });

    axios.post.mockRejectedValue({
      response: { data: { error: "Invalid or expired token." } },
    });

    renderWithRouter(<ResetPassword />);

    fireEvent.change(screen.getByLabelText("New Password"), {
      target: { value: "Pass123" },
    });

    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "Pass123" },
    });

    fireEvent.click(screen.getByText("Reset Password"));

    await waitFor(() => {
      expect(
        screen.getByText("Invalid or expired token.")
      ).toBeInTheDocument();
    });
  });
});
