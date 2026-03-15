import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResendCode from "../components/resendcode"; // Adjust the import path if necessary
import axios from "axios";
import { BrowserRouter } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

// Mock axios
jest.mock("../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("ResendCode component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders input and button", async () => {
    axiosInstance.get.mockResolvedValue({
      headers: { "x-csrftoken": "mocked_csrf_token" },
    });

    renderWithRouter(<ResendCode />);

    expect(await screen.findByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resend code/i })).toBeInTheDocument();
  });

  test("shows success message after resend", async () => {
    axiosInstance.get.mockResolvedValue({
      headers: { "x-csrftoken": "mocked_csrf_token" },
    });

    axiosInstance.post.mockResolvedValue({
      data: { message: "Verification code resent successfully." },
    });

    renderWithRouter(<ResendCode />);

    fireEvent.change(await screen.findByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /resend code/i }));

    expect(await screen.findByText(/verification code resent successfully/i)).toBeInTheDocument();
  });

  test("shows error message on failed resend", async () => {
    axiosInstance.get.mockResolvedValue({
      headers: { "x-csrftoken": "mocked_csrf_token" },
    });

    axiosInstance.post.mockRejectedValue({
      response: {
        data: { error: "User not found." },
      },
    });

    renderWithRouter(<ResendCode />);

    fireEvent.change(await screen.findByLabelText(/email address/i), {
      target: { value: "wrong@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /resend code/i }));

    expect(await screen.findByText(/user not found/i)).toBeInTheDocument();
  });
});
