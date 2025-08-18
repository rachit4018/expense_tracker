import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../config";
import { useNavigate } from "react-router-dom";
// Reusable InputField
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

const ResendCode = () => {
  const [email, setEmail] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}csrf/`, {
          withCredentials: true,
        });
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
    setEmail(e.target.value);
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
        `${BASE_URL}resend_code/`,
        { email },
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
        setTimeout(() => navigate("/verifycode"), 1200);
      }
      else{
        setMessages(response.data.messages || []);
      }
     
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to resend code. Try again.");
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
            Trouble verifying your account?
          </h2>
          <p className="mb-4 text-lg">
            No worries! Enter your email and we'll send the code again so you can activate your account.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>📧 Make sure it's the correct email</li>
            <li>🕒 Code expires after some time</li>
            <li>🗑️ Check your spam/junk folder too</li>
          </ul>
        </div>

        {/* Resend Form */}
        <div className="w-full max-w-md bg-white/90 shadow-xl rounded-xl p-8 backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Resend Verification Code
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
                    msg.toLowerCase().includes("success") || msg.includes("✅")
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
            <InputField
              label="Email Address"
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              required
              autoComplete="email"
              disabled={loading}
            />

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
                  Sending...
                </span>
              ) : (
                "Resend Code"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            Ready to sign in?{" "}
            <a href="/" className="text-indigo-600 hover:underline">
              Log in
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center text-sm text-gray-500 py-6 border-t">
        &copy; {new Date().getFullYear()} Expense Tracker. Verification made easy 💙
      </footer>
    </div>
  );
};

export default ResendCode;
