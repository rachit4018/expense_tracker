import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../config";

// Reusable InputField Component
const InputField = ({
  label,
  type,
  name,
  value,
  onChange,
  required,
  autoComplete,
  error,
  children,
  ...rest
}) => (
  <div className="mb-4">
    <label htmlFor={name} className="block text-gray-700 mb-1 font-medium">
      {label}
    </label>
    <div className="relative">
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
          error ? "border-red-400" : ""
        }`}
        {...rest}
      />
      {children}
    </div>
    {error && (
      <span id={`${name}-error`} className="text-xs text-red-600">
        {error}
      </span>
    )}
  </div>
);

const VerifyCode = () => {
  const [formData, setFormData] = useState({ email: "", code: "" });
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch CSRF token on mount
  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}csrf/`, { withCredentials: true });
        const token = response.headers["x-csrftoken"] || response.data.csrfToken;
        setCsrfToken(token);
      } catch (err) {
        setError("Failed to fetch CSRF token.");
      } finally {
        setLoading(false);
      }
    };

    fetchCSRFToken();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setMessages([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessages([]);

    setLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}verify_code/`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        setMessages(["Verification successful! Redirecting..."]);
        setTimeout(() => navigate("/"), 1200);
      } else {
        setMessages(response.data.messages || []);
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.error || "Verification failed. Please check your details.");
        if (err.response.data.details) {
          const details = Array.isArray(err.response.data.details)
            ? err.response.data.details
            : [err.response.data.details];
          setMessages(details);
        }
      } else {
        setError("An error occurred while submitting.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-100 flex flex-col relative overflow-hidden">
      {/* Pattern overlay */}
      <div
        className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/connected.png')] opacity-10 z-0"
        aria-hidden="true"
      ></div>

      {/* Navbar */}
      <nav className="relative z-10 bg-white/90 shadow-md backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-700">💸 Expense Tracker</h1>
          <a href="/" className="text-indigo-700 hover:underline font-medium">
            Log In
          </a>
        </div>
      </nav>

      {/* Main Section */}
      <section className="relative z-10 flex-grow flex flex-col lg:flex-row items-center justify-between px-6 lg:px-20 py-16 gap-10">
        {/* Info Column */}
        <div className="max-w-xl text-gray-800">
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Verify Your Email Address
          </h2>
          <p className="mb-4 text-lg">
            Enter the verification code sent to your email to activate your account and start tracking your expenses.
          </p>
        </div>

        {/* Verification Form */}
        <div className="w-full max-w-md bg-white/90 shadow-xl rounded-xl p-8 backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Verify Your Account
          </h3>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {messages.length > 0 && (
            <div className="mb-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`px-4 py-2 rounded text-sm mb-1 ${
                    msg.toLowerCase().includes("success")
                      ? "bg-green-100 text-green-700 animate-pulse"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {msg}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} aria-busy={loading}>
            <InputField label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="email" disabled={loading} />
            <InputField label="Verification Code" type="text" name="code" value={formData.code} onChange={handleChange} required autoComplete="off" disabled={loading} />

            <button
              type="submit"
              className={`w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify Code"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            Didn't receive the code?{" "}
            <a href="/resend" className="text-indigo-600 hover:underline">
              Resend Code
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center text-sm text-gray-500 py-6 border-t">
        &copy; {new Date().getFullYear()} Expense Tracker. Built for peace of mind 💙
      </footer>
    </div>
  );
};

export default VerifyCode;
