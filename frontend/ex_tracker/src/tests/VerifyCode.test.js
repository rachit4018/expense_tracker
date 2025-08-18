// VerifyCode.test.js
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import VerifyCode from "../components/verifycode"; // Adjust path as needed

// Wrap component with BrowserRouter for <a> and navigate support
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("VerifyCode Component", () => {
  test("renders inputs and buttons correctly", () => {
    renderWithRouter(<VerifyCode />);

    // Check inputs
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeInTheDocument();

    const codeInput = screen.getByLabelText(/verification code/i);
    expect(codeInput).toBeInTheDocument();

    // Check submit button
    const verifyButton = screen.getByTestId("verify-button");
    expect(verifyButton).toBeInTheDocument();

    // Check "Resend Code" link
    const resendLink = screen.getByText(/resend code/i);
    expect(resendLink).toBeInTheDocument();
    expect(resendLink.closest("a")).toHaveAttribute("href", "/resend");
  });

  test("updates input values when typed", () => {
    renderWithRouter(<VerifyCode />);

    const emailInput = screen.getByLabelText(/email/i);
    const codeInput = screen.getByLabelText(/verification code/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(emailInput.value).toBe("test@example.com");

    fireEvent.change(codeInput, { target: { value: "123456" } });
    expect(codeInput.value).toBe("123456");
  });

  test("submit button can be clicked", () => {
    renderWithRouter(<VerifyCode />);

    const verifyButton = screen.getByTestId("verify-button");

    // Click submit button
    fireEvent.click(verifyButton);

    // Since no API call mock, we just test it doesn't throw and button exists
  });
});
