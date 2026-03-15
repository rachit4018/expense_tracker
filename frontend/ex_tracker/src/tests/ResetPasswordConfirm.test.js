import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ResendPasswordConfirm from "../components/resetpasswordconfirm";
import { BrowserRouter } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

jest.mock("../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
}));

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe("ResendPasswordConfirm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockUseParams.mockReturnValue({ token: "abc123" });
  });

  test("renders new password form and fetches CSRF token", async () => {
    axiosInstance.get.mockResolvedValue({
      data: { csrfToken: "mock-token" },
      headers: {},
    });

    renderWithRouter(<ResendPasswordConfirm />);

    expect(screen.getByText("Reset Your Password")).toBeInTheDocument();
    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith("/csrf/");
    });
  });

  test("submits password reset and shows success message", async () => {
  jest.useFakeTimers();

  axiosInstance.get.mockResolvedValue({
    data: { csrfToken: "mock-csrf" },
    headers: {},
  });

  axiosInstance.post.mockResolvedValue({
    data: { message: "Password reset successful." },
  });

  renderWithRouter(<ResendPasswordConfirm />);

  await waitFor(() => {
    expect(axiosInstance.get).toHaveBeenCalledWith("/csrf/");
  });

  fireEvent.change(screen.getByLabelText("New Password"), {
    target: { value: "NewPass123!" },
  });

  fireEvent.change(screen.getByLabelText("Confirm Password"), {
    target: { value: "NewPass123!" },
  });

  fireEvent.click(screen.getByText("Reset Password"));

  await waitFor(() => {
    expect(axiosInstance.post).toHaveBeenCalledWith(
      "/reset_password/abc123/",
      {
        new_password: "NewPass123!",
        confirm_password: "NewPass123!",
      },
      {
        headers: {
          "X-CSRFToken": "mock-csrf",
        },
      }
    );
  });

  await waitFor(() => {
    expect(
      screen.getByText("Password reset successful.")
    ).toBeInTheDocument();
  });

  act(() => {
    jest.runAllTimers();
  });

  expect(mockNavigate).toHaveBeenCalledWith("/");
});

  test("shows backend error if reset fails", async () => {
    axiosInstance.get.mockResolvedValue({
      data: { csrfToken: "mock-csrf" },
      headers: {},
    });

    axiosInstance.post.mockRejectedValue({
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

    await waitFor(() => {
      expect(
        screen.getByText("Invalid or expired token.")
      ).toBeInTheDocument();
    });
  });

  test("shows CSRF fetch error message", async () => {
    axiosInstance.get.mockRejectedValue(new Error("CSRF failed"));

    renderWithRouter(<ResendPasswordConfirm />);

    await waitFor(() => {
      expect(screen.getByText("Failed to get CSRF token.")).toBeInTheDocument();
    });
  });
});